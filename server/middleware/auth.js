const jwt = require('jsonwebtoken');
const pool = require('../config/dbConfig');

function checkAuthenticated(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Check if user is active
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
}

function checkNotAuthenticated(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET || 'secret');
            return res.status(403).json({ message: "Already authenticated" });
        } catch (err) {
            // Token invalid, so they are not authenticated, proceed
            next();
        }
    } else {
        next();
    }
}

/**
 * Middleware: require kachow_role === 'admin'
 * Must be used AFTER checkAuthenticated
 */
function checkAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.kachow_role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
    }

    next();
}

module.exports = {
    checkAuthenticated,
    checkNotAuthenticated,
    checkAdmin,
};