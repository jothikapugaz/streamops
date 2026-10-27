import "dotenv/config";
import pg from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL.");
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const counts = await pool.query(`
    SELECT
      (SELECT count(*)::int FROM titles) AS title_count,
      (SELECT count(*)::int FROM incidents) AS incident_count
  `);
  const { title_count, incident_count } = counts.rows[0];
  if (title_count > 0 || incident_count > 0) {
    console.error("Seed stopped: this database already contains records.");
    console.error("The seed file is for an empty demo database and may duplicate records if rerun.");
    process.exitCode = 1;
  } else {
    const sql = await readFile(path.join(root, "seed.sql"), "utf8");
    await pool.query(sql);
    console.log("Inserted sample titles and incidents.");
  }
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
