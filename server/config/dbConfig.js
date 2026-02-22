require("dotenv").config()

const { Pool } = require("pg")

// Always prefer DATABASE_URL (Render Postgres) if available
const connectionString = process.env.DATABASE_URL
    || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DB}`;

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
})

module.exports = pool