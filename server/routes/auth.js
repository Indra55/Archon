const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const pool = require("../config/dbConfig");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.github_avatar_url || user.avatar,
            auth_provider: user.auth_provider,
            kachow_role: user.kachow_role || "engineer",
            github_username: user.github_username,
            org_id: user.org_id,
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
    );
};


// @route   GET /auth/github
// @desc    Initiate GitHub OAuth login. Optionally accepts ?join_code=XYZ
// @access  Public
router.get(
    "/github",
    (req, res, next) => {
        // If join_code is provided, stash it in a short-lived cookie
        // so passport strategy can read it after the OAuth redirect
        const joinCode = req.query.join_code;
        if (joinCode) {
            res.cookie("kachow_join_code", String(joinCode).toUpperCase().trim(), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 300000, // 5 minutes — enough for OAuth round-trip
            });
        }
        next();
    },
    passport.authenticate("github", {
        scope: ["user:email", "read:org"],
        session: false,
    })
);

// @route   GET /auth/github/callback
// @desc    GitHub OAuth callback — verifies org membership,
//          creates/updates user, issues JWT
// @access  Public
router.get(
    "/github/callback",
    (req, res, next) => {
        passport.authenticate("github", { session: false }, (err, user, info) => {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
            if (err) {
                console.error("GitHub auth error:", err);
                return res.redirect(`${frontendUrl}/login?error=github_auth_failed`);
            }

            if (!user) {
                // Check specific failure reasons
                const message = info?.message || "auth_failed";
                if (message === "not_org_member") {
                    return res.redirect(`${frontendUrl}/login?error=not_org_member`);
                }
                if (message === "account_deactivated") {
                    return res.redirect(`${frontendUrl}/login?error=account_deactivated`);
                }
                return res.redirect(`${frontendUrl}/login?error=${message}`);
            }

            try {
                const token = generateToken(user);

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                    maxAge: 86400000, // 24 hours
                });

                // Clear the temporary join code cookie
                res.clearCookie("kachow_join_code");

                res.redirect(`${frontendUrl}/dashboard`);
            } catch (tokenErr) {
                console.error("Error generating token:", tokenErr);
                res.redirect(`${frontendUrl}/login?error=token_generation_failed`);
            }
        })(req, res, next);
    }
);

// @route   GET /auth/status
// @desc    Check authentication status — returns user profile
// @access  Public (cookie-based)
router.get("/status", (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.json({ authenticated: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        res.json({
            authenticated: true,
            user: {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                avatar: decoded.avatar,
                auth_provider: decoded.auth_provider,
                kachow_role: decoded.kachow_role,
                github_username: decoded.github_username,
                org_id: decoded.org_id,
            },
        });
    } catch (err) {
        res.json({ authenticated: false });
    }
});

// @route   GET /auth/me
// @desc    Return full current user profile from DB
// @access  Authenticated
router.get("/me", async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const result = await pool.query(
            `SELECT id, username, email, github_id, github_username, github_avatar_url,
                    avatar, kachow_role, team, org_id, is_active,
                    first_login_at, last_login_at, created_at
             FROM users WHERE id = $1`,
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

module.exports = router;
