const express = require("express");
const router = express.Router();
const pool = require("../config/dbConfig");
const { checkAuthenticated, checkAdmin } = require("../middleware/auth");
const { decrypt } = require("../utils/encryption");

// GET /admin/users — List all users
router.get("/users", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, github_id, github_username, github_avatar_url,
                    avatar, kachow_role, team, is_active, first_login_at, last_login_at,
                    created_at, updated_at
             FROM users WHERE org_id IS NOT NULL
             ORDER BY created_at`
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error("Error listing users:", err);
        res.status(500).json({ error: "Failed to list users" });
    }
});

// PATCH /admin/users/:id/role — Update user role
router.patch("/users/:id/role", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["admin", "engineer", "viewer"].includes(role)) {
            return res.status(400).json({ error: "Invalid role. Must be admin, engineer, or viewer." });
        }

        // Prevent admin from changing their own role
        if (id === req.user.id) {
            return res.status(400).json({ error: "You cannot change your own role" });
        }

        const result = await pool.query(
            `UPDATE users SET kachow_role = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, username, kachow_role`,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error("Error updating role:", err);
        res.status(500).json({ error: "Failed to update role" });
    }
});

// PATCH /admin/users/:id/team — Update user team
router.patch("/users/:id/team", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { team } = req.body;

        const result = await pool.query(
            `UPDATE users SET team = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, username, team`,
            [team || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error("Error updating team:", err);
        res.status(500).json({ error: "Failed to update team" });
    }
});

// DELETE /admin/users/:id — Deactivate user
router.delete("/users/:id", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deactivating themselves
        if (id === req.user.id) {
            return res.status(400).json({ error: "You cannot deactivate your own account" });
        }

        const result = await pool.query(
            `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, username, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: result.rows[0], message: "User deactivated" });
    } catch (err) {
        console.error("Error deactivating user:", err);
        res.status(500).json({ error: "Failed to deactivate user" });
    }
});

// GET /admin/org/members — GitHub org members not yet onboarded
router.get("/org/members", checkAuthenticated, checkAdmin, async (req, res) => {
    try {
        // Get org token
        const orgResult = await pool.query(
            "SELECT github_access_token, github_org_slug FROM orgs WHERE is_configured = true LIMIT 1"
        );

        if (orgResult.rows.length === 0) {
            return res.status(400).json({ error: "Org not configured" });
        }

        const orgToken = decrypt(orgResult.rows[0].github_access_token);
        const orgSlug = orgResult.rows[0].github_org_slug;

        // Get all org members from GitHub
        const membersRes = await fetch(
            `https://api.github.com/orgs/${orgSlug}/members?per_page=100`,
            {
                headers: {
                    Authorization: `Bearer ${orgToken}`,
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "Archon",
                },
            }
        );

        if (!membersRes.ok) {
            return res.status(400).json({ error: "Failed to fetch org members from GitHub" });
        }

        const allMembers = await membersRes.json();

        // Get all users who have logged in
        const usersResult = await pool.query(
            "SELECT github_id FROM users WHERE github_id IS NOT NULL"
        );
        const onboardedGithubIds = new Set(usersResult.rows.map((u) => String(u.github_id)));

        // Filter to not-yet-onboarded
        const notOnboarded = allMembers.filter(
            (m) => !onboardedGithubIds.has(String(m.id))
        );

        res.json({
            total_org_members: allMembers.length,
            onboarded: allMembers.length - notOnboarded.length,
            not_onboarded: notOnboarded.map((m) => ({
                github_id: m.id,
                github_username: m.login,
                github_avatar_url: m.avatar_url,
            })),
        });
    } catch (err) {
        console.error("Error fetching org members:", err);
        res.status(500).json({ error: "Failed to fetch org members" });
    }
});

module.exports = router;
