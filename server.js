import "dotenv/config";
import pg from "pg";
import { createApp } from "./lib/app.js";

const { Pool } = pg;
const port = Number(process.env.PORT || 3000);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Copy .env.example to .env and configure PostgreSQL.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = createApp(pool);
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
