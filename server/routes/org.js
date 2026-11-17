const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../config/dbConfig");
const { encrypt, decrypt } = require("../utils/encryption");
const { checkAuthenticated, checkAdmin } = require("../middleware/auth");

/**
 * Generate a random, human-readable join code (like MS Teams)
 * Format: 3 letters + 4 digits (e.g. ARC-1234)
 */
function generateJoinCode() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O to avoid confusion
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < 3; i++) code += letters[crypto.randomInt(letters.length)];
    code += "-";
    for (let i = 0; i < 4; i++) code += digits[crypto.randomInt(digits.length)];
    return code;
}

// GET /org/status — Check if org is configured (public, used for routing)
router.get("/status", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, org_name, github_org_slug, is_configured, created_at FROM orgs WHERE is_configured = true LIMIT 1"
        );

        if (result.rows.length === 0) {
            return res.json({ configured: false });
        }

        const org = result.rows[0];
        return res.json({
            configured: true,
            org: {
                id: org.id,
                org_name: org.org_name,
                github_org_slug: org.github_org_slug,
                created_at: org.created_at,
            },
        });
    } catch (err) {
        console.error("Error checking org status:", err);
        res.status(500).json({ error: "Failed to check org status" });
    }
});

// POST /org/setup — First-time org setup (creates org + first admin user)
router.post("/setup", async (req, res) => {
    try {
        // Check if org already exists
        const existing = await pool.query(
            "SELECT id FROM orgs WHERE is_configured = true LIMIT 1"
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: "Organization is already configured" });
        }

        const { org_name, github_repo_url, github_access_token } = req.body;

        if (!org_name || !github_repo_url || !github_access_token) {
            return res.status(400).json({
                error: "Missing required fields: org_name, github_repo_url, github_access_token",
            });
        }

        // Extract owner/repo from URL
        // e.g. https://github.com/microsoft/vscode → microsoft/vscode
        let github_org_slug = "";
        try {
            const tempUrl = github_repo_url.startsWith('http') ? github_repo_url : `https://${github_repo_url}`;
            const urlObj = new URL(tempUrl);
            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            if (pathParts.length < 2) {
                return res.status(400).json({ error: "Invalid GitHub repository URL" });
            }
            github_org_slug = `${pathParts[0]}/${pathParts[1]}`;
        } catch (e) {
            return res.status(400).json({ error: "Invalid GitHub repository URL format" });
        }

        // Validate token by calling GitHub API
        const userRes = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${github_access_token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Archon",
            },
        });

        if (!userRes.ok) {
            return res.status(400).json({ error: "Invalid GitHub access token" });
        }

        const githubUser = await userRes.json();

        // Validate repo exists and token has access
        const repoRes = await fetch(`https://api.github.com/repos/${github_org_slug}`, {
            headers: {
                Authorization: `Bearer ${github_access_token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "Archon",
            },
        });

        if (!repoRes.ok) {
            return res.status(400).json({
                error: `Cannot access GitHub repository "${github_org_slug}". Check the URL and token permissions.`,
            });
        }

        // Encrypt the token before storage
        const encryptedToken = encrypt(github_access_token);

        // Generate a unique join code
        let joinCode = generateJoinCode();
        // Ensure uniqueness (very unlikely collision but just in case)
        let codeExists = await pool.query("SELECT id FROM orgs WHERE join_code = $1", [joinCode]);
        while (codeExists.rows.length > 0) {
            joinCode = generateJoinCode();
            codeExists = await pool.query("SELECT id FROM orgs WHERE join_code = $1", [joinCode]);
        }

        // Create org
        const orgResult = await pool.query(
            `INSERT INTO orgs (org_name, github_org_slug, github_access_token, join_code, is_configured)
             VALUES ($1, $2, $3, $4, true)
             RETURNING id, org_name, github_org_slug, join_code, is_configured, created_at`,
            [org_name, github_org_slug, encryptedToken, joinCode]
        );

        const org = orgResult.rows[0];

        // Create or update the admin user (the person setting up)
        // Check if user already exists by github_id
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE github_id = $1",
            [String(githubUser.id)]
        );

        let adminUser;
        if (existingUser.rows.length > 0) {
            const updateResult = await pool.query(
                `UPDATE users SET kachow_role = 'admin', org_id = $1, github_username = $2,
                 github_avatar_url = $3, is_active = true, updated_at = CURRENT_TIMESTAMP
                 WHERE github_id = $4
                 RETURNING id, username, email, github_id, github_username, github_avatar_url, kachow_role`,
                [org.id, githubUser.login, githubUser.avatar_url, String(githubUser.id)]
            );
            adminUser = updateResult.rows[0];
        } else {
            const insertResult = await pool.query(
                `INSERT INTO users (username, email, github_id, github_username, github_avatar_url,
                 avatar, auth_provider, kachow_role, org_id, is_active, first_login_at, last_login_at)
                 VALUES ($1, $2, $3, $4, $5, $6, 'github', 'admin', $7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING id, username, email, github_id, github_username, github_avatar_url, kachow_role`,
                [
                    githubUser.login,
                    githubUser.email,
                    String(githubUser.id),
                    githubUser.login,
                    githubUser.avatar_url,
                    githubUser.avatar_url,
                    org.id,
                ]
            );
            adminUser = insertResult.rows[0];
        }

        // Auto-create a project for the connected repo
        const repoName = github_org_slug.split("/").pop() || org_name;
        const existingProject = await pool.query(
            "SELECT id FROM projects WHERE user_id = $1 AND github_repo = $2",
            [adminUser.id, github_org_slug]
        );
        if (existingProject.rows.length === 0) {
            await pool.query(
                `INSERT INTO projects (user_id, name, description, github_repo, github_pat, status)
                 VALUES ($1, $2, $3, $4, $5, 'active')`,
                [
                    adminUser.id,
                    repoName,
                    `Auto-created from org setup for ${org_name}`,
                    github_org_slug,
                    encryptedToken,
                ]
            );
        }

        // Generate JWT for the admin
        const jwt = require("jsonwebtoken");
        const token = jwt.sign(
            {
                id: adminUser.id,
                username: adminUser.username,
                email: adminUser.email,
                avatar: adminUser.github_avatar_url,
                kachow_role: adminUser.kachow_role,
                github_username: adminUser.github_username,
                org_id: org.id,
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "24h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 86400000,
        });

        res.status(201).json({
            message: "Organization configured successfully",
            org: {
                id: org.id,
                org_name: org.org_name,
                github_org_slug: org.github_org_slug,
                join_code: org.join_code,
            },
            user: {
                id: adminUser.id,
                username: adminUser.username,
                kachow_role: adminUser.kachow_role,
            },
        });
    } catch (err) {
        console.error("Error in org setup:", err);
        res.status(500).json({ error: "Failed to configure organization" });
    }
});

// ============================================================
// JOIN CODE MANAGEMENT
// ============================================================

// GET /org/join-code — Admin-only: retrieve the current join code
router.get("/join-code", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT join_code, org_name FROM orgs WHERE is_configured = true LIMIT 1"
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No org configured" });
        }
        res.json({ join_code: result.rows[0].join_code, org_name: result.rows[0].org_name });
    } catch (err) {
        console.error("Error fetching join code:", err);
        res.status(500).json({ error: "Failed to fetch join code" });
    }
});

// POST /org/join-code/regenerate — Admin-only: regenerate a new join code
router.post("/join-code/regenerate", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        let newCode = generateJoinCode();
        let exists = await pool.query("SELECT id FROM orgs WHERE join_code = $1", [newCode]);
        while (exists.rows.length > 0) {
            newCode = generateJoinCode();
            exists = await pool.query("SELECT id FROM orgs WHERE join_code = $1", [newCode]);
        }

        const result = await pool.query(
            `UPDATE orgs SET join_code = $1, updated_at = CURRENT_TIMESTAMP
             WHERE is_configured = true
             RETURNING join_code, org_name`,
            [newCode]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No org configured" });
        }

        res.json({ join_code: result.rows[0].join_code, org_name: result.rows[0].org_name });
    } catch (err) {
        console.error("Error regenerating join code:", err);
        res.status(500).json({ error: "Failed to regenerate join code" });
    }
});

// POST /org/validate-code — Public: validate a join code (used before employee GitHub OAuth)
router.post("/validate-code", async (req, res) => {
    try {
        const { join_code } = req.body;
        if (!join_code) {
            return res.status(400).json({ valid: false, error: "Join code is required" });
        }

        const result = await pool.query(
            "SELECT id, org_name FROM orgs WHERE join_code = $1 AND is_configured = true LIMIT 1",
            [join_code.toUpperCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.json({ valid: false, error: "Invalid join code" });
        }

        res.json({ valid: true, org_name: result.rows[0].org_name });
    } catch (err) {
        console.error("Error validating join code:", err);
        res.status(500).json({ valid: false, error: "Validation failed" });
    }
});

module.exports = router;
