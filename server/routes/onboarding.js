const express = require("express");
const router = express.Router();
const pool = require("../config/dbConfig");
const { checkAuthenticated } = require("../middleware/auth");
const axios = require("axios");

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";
const SERP_API_KEY = process.env.SERP_API_KEY || null;

/**
 * Resolves a video search_query into a real YouTube video object via SerpAPI.
 * Uses SerpAPI's YouTube search engine if SERP_API_KEY is set,
 * otherwise falls back to a YouTube search results URL.
 *
 * SerpAPI docs: https://serpapi.com/youtube-search-api
 * Returns: { title, youtube_id, thumbnail, embed_url, watch_url, channel, duration, search_query }
 */
async function resolveYouTubeVideo(video) {
    const title = video.title || "Tutorial";
    const searchQuery = video.search_query || video.title || "Software Engineering Tutorial";

    // If we already have a verified YouTube ID from the curated library, use it!
    if (video.youtube_id) {
        return {
            title,
            youtube_id: video.youtube_id,
            thumbnail: `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`,
            embed_url: `https://www.youtube.com/embed/${video.youtube_id}`,
            watch_url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
            channel: null,
            duration: null,
            search_query: searchQuery,
        };
    }

    if (SERP_API_KEY) {
        try {
            const serpRes = await axios.get("https://serpapi.com/search.json", {
                params: {
                    engine: "youtube",
                    search_query: searchQuery,
                    api_key: SERP_API_KEY,
                },
                timeout: 10000,
            });

            const results = serpRes.data.video_results;
            const foundVideo = Array.isArray(results) && results.length > 0 ? results[0] : null;

            if (foundVideo) {
                const urlParams = new URL(foundVideo.link).searchParams;
                const videoId = urlParams.get("v");

                return {
                    title: foundVideo.title || title,
                    youtube_id: videoId,
                    thumbnail: foundVideo.thumbnail?.static || foundVideo.thumbnail?.rich || null,
                    embed_url: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
                    watch_url: foundVideo.link || `https://www.youtube.com/watch?v=${videoId}`,
                    channel: foundVideo.channel?.name || null,
                    duration: foundVideo.length || null,
                    search_query: searchQuery,
                };
            }
        } catch (err) {
            console.warn(`SerpAPI YouTube lookup failed for query "${searchQuery}":`, err.message);
        }
    }

    const encodedQuery = encodeURIComponent(searchQuery);
    return {
        title,
        youtube_id: null,
        thumbnail: null,
        embed_url: null,
        watch_url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
        channel: null,
        duration: null,
        search_query: searchQuery,
    };
}

/**
 * Enriches all modules in a learning path by resolving their
 * recommended_videos search_query fields into real YouTube data.
 */
async function enrichModulesWithVideos(modules) {
    if (!Array.isArray(modules)) return modules;

    return Promise.all(
        modules.map(async (module) => {
            if (!Array.isArray(module.recommended_videos)) return module;

            const resolvedVideos = await Promise.all(
                module.recommended_videos.map((video) =>
                    resolveYouTubeVideo(video)
                )
            );

            return { ...module, recommended_videos: resolvedVideos };
        })
    );
}

// POST /onboarding/generate — Generate a learning path for a role, tailored to the user's project
router.post("/generate", checkAuthenticated, async (req, res) => {
    try {
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ error: "Missing 'role' in request body" });
        }

        // Look up the user's org
        const orgResult = await pool.query(
            "SELECT id FROM orgs WHERE is_configured = true LIMIT 1"
        );
        const orgId = orgResult.rows.length > 0 ? orgResult.rows[0].id : null;

        // Get the project the user is working on — this has the github_repo slug
        let repoName = null;
        let repoDescription = "";

        const projectResult = await pool.query(
            "SELECT name, description, github_repo FROM projects WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
            [req.user.id]
        );
        if (projectResult.rows.length > 0) {
            const project = projectResult.rows[0];
            repoName = project.github_repo || project.name;
            repoDescription = project.description || "";
        }

        // Call the agent to generate the learning path — with repo context
        const agentRes = await axios.post(`${AGENT_URL}/api/v1/onboarding/generate`, {
            role,
            repo_name: repoName,
            repo_description: repoDescription,
        }, { timeout: 600000 }); // 10 minute timeout for slow LLMs

        const { learning_path, starter_tasks } = agentRes.data;

        // ── Resolve recommended_videos from search queries → real YouTube data ──
        const enrichedModules = await enrichModulesWithVideos(learning_path.modules || []);
        learning_path.modules = enrichedModules;

        // Save learning path to PostgreSQL
        const pathResult = await pool.query(
            `INSERT INTO learning_paths (user_id, org_id, role, title, description, modules, status, progress_pct)
             VALUES ($1, $2, $3, $4, $5, $6, 'active', 0)
             RETURNING *`,
            [
                req.user.id,
                orgId,
                role,
                learning_path.title || `Learning Path: ${role}`,
                learning_path.description || "",
                JSON.stringify(enrichedModules),  // store enriched modules with real video data
            ]
        );

        const savedPath = pathResult.rows[0];

        // Save starter tasks
        const savedTasks = [];
        if (Array.isArray(starter_tasks)) {
            for (const task of starter_tasks) {
                const taskResult = await pool.query(
                    `INSERT INTO starter_tasks (learning_path_id, title, description, difficulty, linked_nodes, hints, status)
                     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                     RETURNING *`,
                    [
                        savedPath.id,
                        task.title || "Untitled Task",
                        task.description || "",
                        task.difficulty || "easy",
                        JSON.stringify(task.linked_nodes || []),
                        JSON.stringify(task.hints || []),
                    ]
                );
                savedTasks.push(taskResult.rows[0]);
            }
        }

        res.status(201).json({
            learning_path: {
                ...savedPath,
                modules: enrichedModules,  // send enriched modules (with real video data) to frontend
                estimated_total_minutes: learning_path.estimated_total_minutes || 0,
            },
            starter_tasks: savedTasks,
        });
    } catch (err) {
        console.error("Error generating learning path:", err?.response?.data || err.message);
        res.status(500).json({ error: "Failed to generate learning path" });
    }
});

// GET /onboarding/paths — Get all learning paths for the current user
router.get("/paths", checkAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM learning_paths WHERE user_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json({ paths: result.rows });
    } catch (err) {
        console.error("Error fetching learning paths:", err);
        res.status(500).json({ error: "Failed to fetch learning paths" });
    }
});

// GET /onboarding/paths/:id — Get a specific learning path with its tasks
router.get("/paths/:id", checkAuthenticated, async (req, res) => {
    try {
        const pathResult = await pool.query(
            "SELECT * FROM learning_paths WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user.id]
        );

        if (pathResult.rows.length === 0) {
            return res.status(404).json({ error: "Learning path not found" });
        }

        const tasksResult = await pool.query(
            "SELECT * FROM starter_tasks WHERE learning_path_id = $1 ORDER BY created_at ASC",
            [req.params.id]
        );

        res.json({
            path: pathResult.rows[0],
            tasks: tasksResult.rows,
        });
    } catch (err) {
        console.error("Error fetching learning path:", err);
        res.status(500).json({ error: "Failed to fetch learning path" });
    }
});

// PATCH /onboarding/paths/:id/progress — Update module completion and progress
router.patch("/paths/:id/progress", checkAuthenticated, async (req, res) => {
    try {
        const { module_id, completed } = req.body;
        if (!module_id) {
            return res.status(400).json({ error: "Missing 'module_id'" });
        }

        // Get current path
        const pathResult = await pool.query(
            "SELECT * FROM learning_paths WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user.id]
        );

        if (pathResult.rows.length === 0) {
            return res.status(404).json({ error: "Learning path not found" });
        }

        const path = pathResult.rows[0];
        let modules = path.modules || [];

        // Update the specific module's completed status
        modules = modules.map((m) => {
            if (m.id === module_id) {
                return { ...m, completed: !!completed };
            }
            return m;
        });

        // Calculate progress percentage
        const totalModules = modules.length;
        const completedModules = modules.filter((m) => m.completed).length;
        const progressPct = totalModules > 0
            ? Math.round((completedModules / totalModules) * 100)
            : 0;

        const status = progressPct === 100 ? "completed" : "active";

        // Update in database
        await pool.query(
            `UPDATE learning_paths 
             SET modules = $1, progress_pct = $2, status = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [JSON.stringify(modules), progressPct, status, req.params.id]
        );

        res.json({ modules, progress_pct: progressPct, status });
    } catch (err) {
        console.error("Error updating progress:", err);
        res.status(500).json({ error: "Failed to update progress" });
    }
});

// PATCH /onboarding/tasks/:id — Mark a starter task as complete
router.patch("/tasks/:id", checkAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "in_progress", "completed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const completedAt = status === "completed" ? new Date() : null;

        const result = await pool.query(
            `UPDATE starter_tasks 
             SET status = $1, completed_at = $2
             WHERE id = $3
             RETURNING *`,
            [status, completedAt, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ task: result.rows[0] });
    } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Failed to update task" });
    }
});

// GET /onboarding/roles — Get available roles
router.get("/roles", async (req, res) => {
    try {
        const agentRes = await axios.get(`${AGENT_URL}/api/v1/onboarding/roles`, {
            timeout: 10000,
        });
        res.json(agentRes.data);
    } catch (err) {
        // Fallback roles if agent is unavailable
        res.json([
            { value: "backend_engineer", label: "Backend Engineer" },
            { value: "frontend_developer", label: "Frontend Developer" },
            { value: "sre", label: "SRE" },
            { value: "fullstack_engineer", label: "Fullstack Engineer" },
            { value: "devops_engineer", label: "DevOps Engineer" },
        ]);
    }
});

// DELETE /onboarding/paths/:id — Delete a learning path
router.delete("/paths/:id", checkAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            "DELETE FROM learning_paths WHERE id = $1 AND user_id = $2 RETURNING id",
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Learning path not found" });
        }

        res.json({ message: "Learning path deleted" });
    } catch (err) {
        console.error("Error deleting learning path:", err);
        res.status(500).json({ error: "Failed to delete learning path" });
    }
});

module.exports = router;