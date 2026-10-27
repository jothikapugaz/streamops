import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateTitleInput,
  validateIncidentInput,
  validateIncidentStatus
} from "./validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build the HTTP application around an injected pg-compatible pool.
 * Injection lets integration tests exercise the real routes against a
 * dedicated PostgreSQL test database without starting a second DB pool.
 */
export function createApp(pool) {
  if (!pool || typeof pool.query !== "function") {
    throw new TypeError("createApp requires a PostgreSQL-compatible pool.");
  }

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));

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

  return app;
}
