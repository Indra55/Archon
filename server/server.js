const express = require("express")
const app = express()
const cors = require('cors');
const cookieParser = require("cookie-parser");
const passport = require("./config/passport");
require("dotenv").config()

app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(passport.initialize());

// Routes
app.use("/", require("./routes/index"))
app.use("/users", require("./routes/users"))
app.use("/auth", require("./routes/auth"))
app.use("/knowledge", require("./routes/knowledge"))
app.use("/projects", require("./routes/projects"))

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

// Global error handler to prevent crashing
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack);
    res.status(500).json({ error: "Internal server error", message: err.message });
});

// KA-CHOW API v1 Routes
app.use("/api/v1/org", require("./routes/org"))
app.use("/api/v1/knowledge", require("./routes/knowledge"))
app.use("/api/v1/admin", require("./routes/admin"))
app.use("/api/v1/onboarding", require("./routes/onboarding"))

const PORT = process.env.PORT || 5555
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
server.timeout = 600000; // 10 minutes (600 seconds) for slow LLM generations

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error('Server error:', error);
    }
});

// Prevent process from exiting on unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
