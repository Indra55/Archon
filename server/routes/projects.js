const express = require("express");
const router = express.Router();
const pool = require("../config/dbConfig");
const { checkAuthenticated } = require("../middleware/auth");

// All project routes require authentication
router.use(checkAuthenticated);

// ─── Helper: validate a GitHub PAT against a repo ────────────────────────────
async function validateGithubPat(pat, repo) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
                Authorization: `Bearer ${pat}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return {
                valid: false,
                error: response.status === 404
                    ? "Repository not found or PAT doesn't have access"
                    : data.message || "Invalid PAT",
            };
        }

        const repoData = await response.json();

        // Check if we have push (write) access
        if (!repoData.permissions?.push) {
            return {
                valid: false,
                error: "PAT doesn't have write access to this repository. Please create a fine-grained PAT with 'Contents: Read and write' permission.",
            };
        }

        return {
            valid: true,
            repoInfo: {
                full_name: repoData.full_name,
                description: repoData.description,
                private: repoData.private,
                default_branch: repoData.default_branch,
            },
        };
    } catch (err) {
        return { valid: false, error: "Failed to connect to GitHub API" };
    }
}

// ─── Helper: create webhook on GitHub repository ──────────────────────────────
async function createGithubWebhook(pat, repo) {
    const ngrokUrl = process.env.NGROK_URL;
    if (!ngrokUrl) {
        console.warn("NGROK_URL not set. Skipping webhook registration.");
        return { success: false, error: "NGROK_URL not configured" };
    }

    const webhookUrl = `${ngrokUrl}/api/v1/webhook/github`;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "";

    try {
        // First check if a webhook with this URL already exists
        const listResponse = await fetch(`https://api.github.com/repos/${repo}/hooks`, {
            headers: {
                Authorization: `Bearer ${pat}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        if (listResponse.ok) {
            const hooks = await listResponse.json();
            const existingHook = hooks.find(h => h.config?.url === webhookUrl);
            if (existingHook) {
                console.log(`Webhook already exists for ${repo} at ${webhookUrl}`);
                return { success: true, hook: existingHook };
            }
        }

        // Create new webhook
        console.log(`Creating webhook for ${repo} pointing to ${webhookUrl}`);
        const createResponse = await fetch(`https://api.github.com/repos/${repo}/hooks`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pat}`,
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: "web",
                active: true,
                events: ["push", "pull_request"],
                config: {
                    url: webhookUrl,
                    content_type: "json",
                    secret: webhookSecret,
                    insecure_ssl: "0"
                }
            })
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json().catch(() => ({}));
            console.error("Failed to create webhook:", errorData);
            return { success: false, error: errorData.message || "Failed to create webhook" };
        }

        const newHook = await createResponse.json();
        return { success: true, hook: newHook };
    } catch (err) {
        console.error("Error creating webhook:", err);
        return { success: false, error: "Failed to connect to GitHub API for webhook generation" };
    }
}

// ─── POST /projects — Create a new project ───────────────────────────────────

router.post("/", async (req, res) => {
    const { name, description, github_repo, github_pat } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name || !github_repo || !github_pat) {
        return res.status(400).json({
            error: "Missing required fields: name, github_repo, github_pat",
        });
    }

    // Normalize repo format (accept full URL or owner/repo)
    let normalizedRepo = github_repo.trim();
    const urlMatch = normalizedRepo.match(
        /github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/
    );
    if (urlMatch) {
        normalizedRepo = urlMatch[1];
    }

    // Validate format
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(normalizedRepo)) {
        return res.status(400).json({
            error: "Invalid repo format. Use 'owner/repo' or a GitHub URL.",
        });
    }

    // Validate PAT against the repo
    const validation = await validateGithubPat(github_pat, normalizedRepo);
    if (!validation.valid) {
        return res.status(400).json({
            error: validation.error,
            field: "github_pat",
        });
    }

    try {
        // Check for duplicate
        const existing = await pool.query(
            "SELECT id FROM projects WHERE user_id = $1 AND github_repo = $2",
            [userId, normalizedRepo]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: "You already have a project connected to this repository",
                existing_project_id: existing.rows[0].id,
            });
        }

        const result = await pool.query(
            `INSERT INTO projects (user_id, name, description, github_repo, github_pat)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, description, github_repo, status, created_at`,
            [userId, name.trim(), description?.trim() || null, normalizedRepo, github_pat]
        );

        // Attempt to create the webhook
        const webhookResult = await createGithubWebhook(github_pat, normalizedRepo);

        res.status(201).json({
            message: "Project created successfully",
            project: {
                ...result.rows[0],
                repo_info: validation.repoInfo,
                webhook_created: webhookResult.success,
                webhook_error: webhookResult.error || null

            },
        });
    } catch (err) {
        console.error("Error creating project:", err);
        res.status(500).json({ error: "Failed to create project" });
    }
});

// ─── GET /projects — List user's projects ────────────────────────────────────
router.get("/", async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT DISTINCT p.id, p.name, p.description, p.github_repo, p.status, p.last_run_at, p.created_at, p.updated_at
             FROM projects p
             JOIN users pu ON p.user_id = pu.id
             JOIN users cu ON cu.id = $1
             WHERE p.user_id = $1 
                OR (pu.org_id = cu.org_id AND pu.kachow_role = 'admin')
             ORDER BY p.updated_at DESC`,

            [userId]
        );

        res.json({ projects: result.rows });
    } catch (err) {
        console.error("Error fetching projects:", err);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

// ─── GET /projects/:id — Get a single project ───────────────────────────────
router.get("/:id", async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT DISTINCT p.id, p.name, p.description, p.github_repo, p.status, p.last_run_at, p.created_at, p.updated_at
             FROM projects p
             JOIN users pu ON p.user_id = pu.id
             JOIN users cu ON cu.id = $2
             WHERE p.id = $1 AND (p.user_id = $2 OR (pu.org_id = cu.org_id AND pu.kachow_role = 'admin'))`,

            [projectId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({ project: result.rows[0] });
    } catch (err) {
        console.error("Error fetching project:", err);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

// ─── GET /projects/:id/pat — Get PAT for a project (used by agent) ──────────
router.get("/:id/pat", async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT DISTINCT p.github_pat, p.github_repo
             FROM projects p
             JOIN users pu ON p.user_id = pu.id
             JOIN users cu ON cu.id = $2
             WHERE p.id = $1 AND (p.user_id = $2 OR (pu.org_id = cu.org_id AND pu.kachow_role = 'admin'))`,

            [projectId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({
            github_pat: result.rows[0].github_pat,
            github_repo: result.rows[0].github_repo,
        });
    } catch (err) {
        console.error("Error fetching project PAT:", err);
        res.status(500).json({ error: "Failed to fetch project PAT" });
    }
});

// ─── PUT /projects/:id — Update a project ───────────────────────────────────
router.put("/:id", async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { name, description, github_pat } = req.body;

    try {
        // Verify ownership
        const existing = await pool.query(
            "SELECT id, github_repo FROM projects WHERE id = $1 AND user_id = $2",
            [projectId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        // If PAT is being updated, validate it
        if (github_pat) {
            const validation = await validateGithubPat(
                github_pat,
                existing.rows[0].github_repo
            );
            if (!validation.valid) {
                return res.status(400).json({
                    error: validation.error,
                    field: "github_pat",
                });
            }
        }

        const result = await pool.query(
            `UPDATE projects
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 github_pat = COALESCE($3, github_pat),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4 AND user_id = $5
             RETURNING id, name, description, github_repo, status, updated_at`,
            [name?.trim(), description?.trim(), github_pat, projectId, userId]
        );

        res.json({
            message: "Project updated successfully",
            project: result.rows[0],
        });
    } catch (err) {
        console.error("Error updating project:", err);
        res.status(500).json({ error: "Failed to update project" });
    }
});

// ─── DELETE /projects/:id — Delete a project ────────────────────────────────
router.delete("/:id", async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;

    try {
        const result = await pool.query(
            "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id, name",
            [projectId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.json({
            message: "Project deleted successfully",
            deleted: result.rows[0],
        });
    } catch (err) {
        console.error("Error deleting project:", err);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

// ─── POST /projects/validate-pat — Validate a PAT without creating ──────────
router.post("/validate-pat", async (req, res) => {
    const { github_repo, github_pat } = req.body;

    if (!github_repo || !github_pat) {
        return res.status(400).json({
            error: "Missing required fields: github_repo, github_pat",
        });
    }

    // Normalize repo
    let normalizedRepo = github_repo.trim();
    const urlMatch = normalizedRepo.match(
        /github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/
    );
    if (urlMatch) {
        normalizedRepo = urlMatch[1];
    }

    const validation = await validateGithubPat(github_pat, normalizedRepo);
    res.json(validation);
});

module.exports = router;
