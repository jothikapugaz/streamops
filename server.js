import "dotenv/config";
import express from "express";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateTitleInput,
  validateIncidentInput,
  validateIncidentStatus
} from "./lib/validation.js";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 3000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/titles", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, type, genre, region, availability, release_date, created_at FROM titles ORDER BY created_at DESC, title ASC"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/titles", async (req, res, next) => {
  const result = validateTitleInput(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  try {
    const { title, type, genre, region, availability, releaseDate } = result.value;
    const { rows } = await pool.query(
      "INSERT INTO titles (title, type, genre, region, availability, release_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, type, genre, region, availability, release_date, created_at",
      [title, type, genre, region, availability, releaseDate]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/incidents", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, service, severity, status, description, reported_at, updated_at FROM incidents ORDER BY CASE status WHEN 'Open' THEN 1 WHEN 'Investigating' THEN 2 ELSE 3 END, CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, updated_at DESC"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/incidents", async (req, res, next) => {
  const result = validateIncidentInput(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  try {
    const { title, service, severity, status, description } = result.value;
    const { rows } = await pool.query(
      "INSERT INTO incidents (title, service, severity, status, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, service, severity, status, description, reported_at, updated_at",
      [title, service, severity, status, description]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/incidents/:id", async (req, res, next) => {
  const id = String(req.params.id || "").trim();
  const status = String((req.body || {}).status || "");

  if (!id) return res.status(400).json({ error: "An incident ID is required." });
  const validationError = validateIncidentStatus(status);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const { rows } = await pool.query(
      "UPDATE incidents SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, title, service, severity, status, description, reported_at, updated_at",
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: "Incident not found." });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error("[StreamOps API]", error);
  if (res.headersSent) return;
  res.status(500).json({ error: "An unexpected server error occurred. Check the server terminal for details." });
});

const server = app.listen(port, () => {
  console.log("StreamOps is running at http://localhost:" + port);
  console.log("Health check: http://localhost:" + port + "/api/health");
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
