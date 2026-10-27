import "dotenv/config";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL.");
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const migrationsDir = path.join(root, "migrations");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS streamops_schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort();

  for (const name of files) {
    const alreadyApplied = await pool.query(
      "SELECT name FROM streamops_schema_migrations WHERE name = $1",
      [name]
    );
    if (alreadyApplied.rowCount) {
      console.log("Skipping already-applied migration: " + name);
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO streamops_schema_migrations (name) VALUES ($1)",
        [name]
      );
      await client.query("COMMIT");
      console.log("Applied migration: " + name);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  console.log("Database migrations are up to date.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
