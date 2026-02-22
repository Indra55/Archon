const express = require("express");
const router = express.Router();
const pool = require("../config/dbConfig");
const { checkAuthenticated, checkAdmin } = require("../middleware/auth");
const { encrypt, decrypt } = require("../utils/encryption");
const axios = require("axios");

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

// GET /knowledge/sources — List all knowledge sources for the org
router.get("/sources", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const orgResult = await pool.query(
            "SELECT id FROM orgs WHERE is_configured = true LIMIT 1"
        );
        if (orgResult.rows.length === 0) {
            return res.status(400).json({ error: "Org not configured" });
        }
        const orgId = orgResult.rows[0].id;

        const result = await pool.query(
            `SELECT id, source_type, config, last_synced_at, status,
                    documents_ingested_count, sync_error, created_at, updated_at
             FROM knowledge_sources WHERE org_id = $1 ORDER BY created_at`,
            [orgId]
        );

        // Strip sensitive tokens from config before sending to frontend
        const sources = result.rows.map((s) => {
            const config = { ...s.config };
            if (config.token) config.token = "••••••••";
            return { ...s, config };
        });

        res.json({ sources });
    } catch (err) {
        console.error("Error listing knowledge sources:", err);
        res.status(500).json({ error: "Failed to list knowledge sources" });
    }
});

// POST /knowledge/sources — Create or update a knowledge source
router.post("/sources", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const orgResult = await pool.query(
            "SELECT id FROM orgs WHERE is_configured = true LIMIT 1"
        );
        if (orgResult.rows.length === 0) {
            return res.status(400).json({ error: "Org not configured" });
        }
        const orgId = orgResult.rows[0].id;

        const { source_type, config } = req.body;

        if (!source_type || !config) {
            return res.status(400).json({ error: "Missing source_type or config" });
        }

        if (!["slack", "github"].includes(source_type)) {
            return res.status(400).json({ error: "source_type must be 'slack' or 'github'" });
        }

        // Encrypt token if present in config
        const storedConfig = { ...config };
        if (storedConfig.token) {
            storedConfig.token = encrypt(storedConfig.token);
        }

        // Check if source of this type already exists
        const existing = await pool.query(
            "SELECT id FROM knowledge_sources WHERE org_id = $1 AND source_type = $2",
            [orgId, source_type]
        );

        let source;
        if (existing.rows.length > 0) {
            // Update existing
            const updateResult = await pool.query(
                `UPDATE knowledge_sources SET config = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                 RETURNING id, source_type, last_synced_at, status, documents_ingested_count, created_at`,
                [JSON.stringify(storedConfig), existing.rows[0].id]
            );
            source = updateResult.rows[0];
        } else {
            // Create new
            const insertResult = await pool.query(
                `INSERT INTO knowledge_sources (org_id, source_type, config)
                 VALUES ($1, $2, $3)
                 RETURNING id, source_type, last_synced_at, status, documents_ingested_count, created_at`,
                [orgId, source_type, JSON.stringify(storedConfig)]
            );
            source = insertResult.rows[0];
        }

        res.status(201).json({ source });
    } catch (err) {
        console.error("Error saving knowledge source:", err);
        res.status(500).json({ error: "Failed to save knowledge source" });
    }
});

// POST /knowledge/sources/:id/test — Test connection for a source
router.post("/sources/:id/test", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT * FROM knowledge_sources WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Source not found" });
        }

        const source = result.rows[0];
        const config = source.config;

        if (source.source_type === "slack") {
            // Use the token from request body if provided (for new/unsaved tokens)
            // otherwise decrypt stored token
            const token = req.body.token || decrypt(config.token);

            const slackRes = await fetch("https://slack.com/api/auth.test", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const slackData = await slackRes.json();

            if (slackData.ok) {
                await pool.query(
                    "UPDATE knowledge_sources SET status = 'connected', sync_error = NULL WHERE id = $1",
                    [id]
                );
                return res.json({ success: true, team: slackData.team, user: slackData.user });
            } else {
                await pool.query(
                    "UPDATE knowledge_sources SET status = 'error', sync_error = $1 WHERE id = $2",
                    [slackData.error, id]
                );
                return res.json({ success: false, error: slackData.error });
            }
        } else if (source.source_type === "github") {
            // GitHub uses the org token — no separate token needed
            const orgResult = await pool.query(
                "SELECT github_access_token FROM orgs WHERE id = $1",
                [source.org_id]
            );
            const orgToken = decrypt(orgResult.rows[0].github_access_token);

            const ghRes = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${orgToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "KA-CHOW",
                },
            });

            if (ghRes.ok) {
                await pool.query(
                    "UPDATE knowledge_sources SET status = 'connected', sync_error = NULL WHERE id = $1",
                    [id]
                );
                return res.json({ success: true });
            } else {
                await pool.query(
                    "UPDATE knowledge_sources SET status = 'error', sync_error = 'GitHub token invalid' WHERE id = $1",
                    [id]
                );
                return res.json({ success: false, error: "GitHub token invalid" });
            }
        }

        res.status(400).json({ error: "Unknown source type" });
    } catch (err) {
        console.error("Error testing knowledge source:", err);
        res.status(500).json({ error: "Failed to test connection" });
    }
});

// POST /knowledge/sources/:id/sync — Trigger sync for a source
router.post("/sources/:id/sync", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT * FROM knowledge_sources WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Source not found" });
        }

        const source = result.rows[0];
        const config = source.config;

        if (source.source_type === "slack") {
            const token = decrypt(config.token);
            const channels = config.channels || [];
            let totalMessages = 0;

            for (const channel of channels) {
                try {
                    // Get channel ID by name
                    const listRes = await fetch(
                        `https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=1000`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const listData = await listRes.json();

                    if (!listData.ok) continue;

                    const channelObj = listData.channels?.find(
                        (c) => c.name === channel.replace("#", "")
                    );
                    if (!channelObj) continue;

                    // Fetch recent messages
                    const histRes = await fetch(
                        `https://slack.com/api/conversations.history?channel=${channelObj.id}&limit=200`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const histData = await histRes.json();

                    if (!histData.ok) continue;

                    // Store messages as knowledge documents
                    for (const msg of histData.messages || []) {
                        if (msg.text && msg.text.trim().length > 10) {
                            await pool.query(
                                `INSERT INTO knowledge_documents (source_id, title, content, metadata)
                                 VALUES ($1, $2, $3, $4)
                                 ON CONFLICT DO NOTHING`,
                                [
                                    id,
                                    `Slack: #${channel}`,
                                    msg.text,
                                    JSON.stringify({ channel, user: msg.user, ts: msg.ts }),
                                ]
                            );
                            totalMessages++;
                        }
                    }
                } catch (channelErr) {
                    console.error(`Error syncing channel ${channel}:`, channelErr);
                }
            }

            await pool.query(
                `UPDATE knowledge_sources
                 SET last_synced_at = CURRENT_TIMESTAMP, status = 'connected',
                     documents_ingested_count = $1, sync_error = NULL
                 WHERE id = $2`,
                [totalMessages, id]
            );

            return res.json({
                success: true,
                documents_ingested: totalMessages,
                synced_at: new Date().toISOString(),
            });
        } else if (source.source_type === "github") {
            // Get org token
            const orgResult = await pool.query(
                "SELECT github_access_token, github_org_slug FROM orgs WHERE id = $1",
                [source.org_id]
            );
            const orgToken = decrypt(orgResult.rows[0].github_access_token);
            const orgSlug = orgResult.rows[0].github_org_slug;
            const includeAllMarkdown = config.include_all_markdown || false;
            const specificRepos = config.repos || [];

            let repos = [];

            if (specificRepos.length > 0) {
                repos = specificRepos.map((r) => ({ full_name: `${orgSlug}/${r}`, name: r }));
            } else {
                // List all org repos
                const reposRes = await fetch(
                    `https://api.github.com/orgs/${orgSlug}/repos?per_page=100&type=all`,
                    {
                        headers: {
                            Authorization: `Bearer ${orgToken}`,
                            Accept: "application/vnd.github.v3+json",
                            "User-Agent": "KA-CHOW",
                        },
                    }
                );
                if (reposRes.ok) {
                    repos = await reposRes.json();
                }
            }

            let totalFiles = 0;

            for (const repo of repos) {
                try {
                    const repoName = repo.full_name || `${orgSlug}/${repo.name}`;

                    if (includeAllMarkdown) {
                        // Search for all .md files
                        const searchRes = await fetch(
                            `https://api.github.com/search/code?q=extension:md+repo:${repoName}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${orgToken}`,
                                    Accept: "application/vnd.github.v3+json",
                                    "User-Agent": "KA-CHOW",
                                },
                            }
                        );
                        if (searchRes.ok) {
                            const searchData = await searchRes.json();
                            for (const item of (searchData.items || []).slice(0, 20)) {
                                const fileRes = await fetch(item.url, {
                                    headers: {
                                        Authorization: `Bearer ${orgToken}`,
                                        Accept: "application/vnd.github.v3+json",
                                        "User-Agent": "KA-CHOW",
                                    },
                                });
                                if (fileRes.ok) {
                                    const fileData = await fileRes.json();
                                    const content = Buffer.from(fileData.content || "", "base64").toString("utf-8");
                                    if (content.trim().length > 10) {
                                        await pool.query(
                                            `INSERT INTO knowledge_documents (source_id, title, content, metadata)
                                             VALUES ($1, $2, $3, $4)`,
                                            [id, item.path, content, JSON.stringify({ repo: repoName, path: item.path })]
                                        );
                                        totalFiles++;
                                    }
                                }
                            }
                        }
                    } else {
                        // README only
                        const readmeRes = await fetch(
                            `https://api.github.com/repos/${repoName}/readme`,
                            {
                                headers: {
                                    Authorization: `Bearer ${orgToken}`,
                                    Accept: "application/vnd.github.v3+json",
                                    "User-Agent": "KA-CHOW",
                                },
                            }
                        );
                        if (readmeRes.ok) {
                            const readmeData = await readmeRes.json();
                            const content = Buffer.from(readmeData.content || "", "base64").toString("utf-8");
                            if (content.trim().length > 10) {
                                await pool.query(
                                    `INSERT INTO knowledge_documents (source_id, title, content, metadata)
                                     VALUES ($1, $2, $3, $4)`,
                                    [id, `README — ${repoName}`, content, JSON.stringify({ repo: repoName, path: "README.md" })]
                                );
                                totalFiles++;
                            }
                        }
                    }
                } catch (repoErr) {
                    console.error(`Error syncing repo:`, repoErr);
                }
            }

            await pool.query(
                `UPDATE knowledge_sources
                 SET last_synced_at = CURRENT_TIMESTAMP, status = 'connected',
                     documents_ingested_count = $1, sync_error = NULL
                 WHERE id = $2`,
                [totalFiles, id]
            );

            return res.json({
                success: true,
                documents_ingested: totalFiles,
                repos_scanned: repos.length,
                synced_at: new Date().toISOString(),
            });
        }

        res.status(400).json({ error: "Unknown source type" });
    } catch (err) {
        console.error("Error syncing knowledge source:", err);
        res.status(500).json({ error: "Failed to sync knowledge source" });
    }
});

// Proxy to Python Agent: GET /api/v1/knowledge/graph
router.get("/graph", async (req, res) => {
    console.log(`[proxy] GET /api/v1/knowledge/graph -> ${AGENT_URL}`);
    try {
        const response = await axios.get(`${AGENT_URL}/api/v1/knowledge/graph`);
        console.log(`[proxy] Status: ${response.status} | Data size: ${JSON.stringify(response.data).length} bytes`);
        res.json(response.data);
    } catch (error) {
        console.error("[proxy] Error fetching graph:", error.message);
        if (error.response) {
            console.error("[proxy] Agent Error Response:", error.response.data);
        }
        res.status(error.response?.status || 500).json({
            error: "Failed to fetch graph from knowledge agent",
            details: error.message
        });
    }
});

// Proxy to Python Agent: GET /api/v1/knowledge/health
router.get("/health", async (req, res) => {
    console.log(`[proxy] GET /api/v1/knowledge/health -> ${AGENT_URL}`);
    try {
        const response = await axios.get(`${AGENT_URL}/api/v1/knowledge/health`);
        console.log(`[proxy] Status: ${response.status}`);
        res.json(response.data);
    } catch (error) {
        console.error("[proxy] Error fetching health:", error.message);
        res.status(error.response?.status || 500).json({
            error: "Failed to fetch health from knowledge agent",
            details: error.message
        });
    }
});

// Proxy to Python Agent: GET /api/v1/knowledge/impact/scenarios
router.get("/impact/scenarios", async (req, res) => {
    console.log(`[proxy] GET /api/v1/knowledge/impact/scenarios -> ${AGENT_URL}`);
    try {
        const response = await axios.get(`${AGENT_URL}/api/v1/knowledge/impact/scenarios`);
        console.log(`[proxy] Status: ${response.status} | Scenarios: ${response.data.length}`);
        res.json(response.data);
    } catch (error) {
        console.error("[proxy] Error fetching scenarios:", error.message);
        res.status(error.response?.status || 500).json({
            error: "Failed to fetch suggested scenarios",
            details: error.message
        });
    }
});

// Proxy to Python Agent: POST /api/v1/knowledge/impact/analyze
router.post("/impact/analyze", async (req, res) => {
    console.log(`[proxy] POST /api/v1/knowledge/impact/analyze -> ${AGENT_URL}`);
    console.log(`[proxy] Payload: ${JSON.stringify(req.body)}`);
    try {
        const response = await axios.post(`${AGENT_URL}/api/v1/knowledge/impact/analyze`, req.body, { timeout: 120000 });
        console.log(`[proxy] Status: ${response.status} | Success: ${!response.data?.error}`);
        const rpt = response.data?.report;
        console.log(`[proxy] Report keys:`, rpt ? Object.keys(rpt) : 'NO REPORT');
        console.log(`[proxy] Report.summary:`, JSON.stringify(rpt?.summary || rpt?.riskLevel || 'MISSING'));
        console.log(`[proxy] Report.impact_analysis keys:`, rpt?.impact_analysis ? Object.keys(rpt.impact_analysis) : 'MISSING');
        console.log(`[proxy] Graph nodes: ${response.data?.graph?.nodes?.length || 0}, edges: ${response.data?.graph?.edges?.length || 0}`);
        res.json(response.data);
    } catch (error) {
        console.error("[proxy] Error analyzing impact:", error.message);
        if (error.code === 'ECONNABORTED') {
            console.error("[proxy] Request TIMEOUT after 120s");
        }
        res.status(error.response?.status || 500).json({
            error: "Failed to analyze impact",
            details: error.message
        });
    }
});

// Proxy to Python Agent: POST /api/v1/knowledge/impact/followup
router.post("/impact/followup", async (req, res) => {
    console.log(`[proxy] POST /api/v1/knowledge/impact/followup -> ${AGENT_URL}`);
    try {
        const response = await axios.post(`${AGENT_URL}/api/v1/knowledge/impact/followup`, req.body, { timeout: 60000 });
        console.log(`[proxy] Status: ${response.status} | Answer keys:`, response.data ? Object.keys(response.data) : 'EMPTY');
        res.json(response.data);
    } catch (error) {
        console.error("[proxy] Error in follow-up:", error.message);
        res.status(error.response?.status || 500).json({
            error: "Failed to process follow-up question",
            details: error.message
        });
    }
});


module.exports = router;
