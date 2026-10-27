import "dotenv/config";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { createApp } from "../lib/app.js";

const connectionString = process.env.STREAMOPS_TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "STREAMOPS_TEST_DATABASE_URL is required for integration tests. Use a dedicated database named streamops_test; never point this variable at your development or production database."
  );
}

const parsedDatabaseUrl = new URL(connectionString);
const databaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, ""));
if (!/(^|[_-])test$/i.test(databaseName)) {
  throw new Error(
    "Safety check failed: the integration-test database name must end in '_test' or '-test' (for example, streamops_test)."
  );
}

const { Pool } = pg;
const pool = new Pool({ connectionString });
const runId = `it-${process.pid}-${Date.now()}`;
let server;
let baseUrl;

before(async () => {
  // The migrations are idempotent and create only the application tables.
  for (const migration of ["001_titles.sql", "002_incidents.sql"]) {
    const sql = await readFile(new URL(`../migrations/${migration}`, import.meta.url), "utf8");
    await pool.query(sql);
  }

  await new Promise((resolve, reject) => {
    server = createApp(pool).listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not determine the integration-test server address."));
        return;
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
    server.once("error", reject);
  });
});

after(async () => {
  try {
    await pool.query("DELETE FROM titles WHERE title LIKE $1", [`StreamOps Integration ${runId}%`]);
    await pool.query("DELETE FROM incidents WHERE title LIKE $1", [`StreamOps Integration ${runId}%`]);
  } finally {
    if (server) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await pool.end();
  }
});

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { "content-type": "application/json" } : {}),
      ...options?.headers
    }
  });
}

test("health endpoint confirms the API can query PostgreSQL", async () => {
  const response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", database: "connected" });
});

test("title creation is persisted and appears in subsequent catalogue reads", async () => {
  const title = `StreamOps Integration ${runId} - Title`;
  const create = await request("/api/titles", {
    method: "POST",
    body: JSON.stringify({ title, genre: "Integration Test", type: "Film", region: "India", availability: "Available" })
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.ok(created.id);
  assert.equal(created.title, title);
  assert.equal(created.type, "Film");

  const list = await request("/api/titles");
  assert.equal(list.status, 200);
  const rows = await list.json();
  assert.ok(rows.some((row) => row.id === created.id && row.title === title));

  // A direct database read verifies persistence beyond the HTTP response.
  const stored = await pool.query("SELECT title FROM titles WHERE id = $1", [created.id]);
  assert.equal(stored.rows[0]?.title, title);
});

test("invalid title payload returns 400 and is not inserted", async () => {
  const title = `StreamOps Integration ${runId} - Invalid title`;
  const response = await request("/api/titles", {
    method: "POST",
    body: JSON.stringify({ title, genre: "", type: "Film" })
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /required/i);
  const stored = await pool.query("SELECT id FROM titles WHERE title = $1", [title]);
  assert.equal(stored.rowCount, 0);
});

test("incident creation, status update, and later reads use PostgreSQL", async () => {
  const title = `StreamOps Integration ${runId} - Incident`;
  const create = await request("/api/incidents", {
    method: "POST",
    body: JSON.stringify({
      title,
      service: "Playback API",
      severity: "High",
      status: "Open",
      description: "Created by the automated integration test."
    })
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.ok(created.id);
  assert.equal(created.status, "Open");

  const update = await request(`/api/incidents/${encodeURIComponent(created.id)}`, {
    method: "PUT",
    body: JSON.stringify({ status: "Investigating" })
  });
  assert.equal(update.status, 200);
  assert.equal((await update.json()).status, "Investigating");

  const list = await request("/api/incidents");
  assert.equal(list.status, 200);
  const rows = await list.json();
  assert.ok(rows.some((row) => row.id === created.id && row.status === "Investigating"));

  const stored = await pool.query("SELECT status FROM incidents WHERE id = $1", [created.id]);
  assert.equal(stored.rows[0]?.status, "Investigating");
});

test("invalid incident status returns 400 and unknown incident returns 404", async () => {
  const invalid = await request("/api/incidents/INC-NOT-REAL", {
    method: "PUT",
    body: JSON.stringify({ status: "Pending" })
  });
  assert.equal(invalid.status, 400);

  const missing = await request("/api/incidents/INC-NOT-REAL", {
    method: "PUT",
    body: JSON.stringify({ status: "Resolved" })
  });
  assert.equal(missing.status, 404);
  assert.match((await missing.json()).error, /not found/i);
});
