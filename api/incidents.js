import { db } from "hatchable";
import { validateIncidentInput } from "lib/validation.js";

export const access = "public";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  if (req.method === "GET") {
    const { rows } = await db.query(
      "SELECT id, title, service, severity, status, description, reported_at, updated_at FROM incidents ORDER BY CASE status WHEN 'Open' THEN 1 WHEN 'Investigating' THEN 2 ELSE 3 END, CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, updated_at DESC"
    );
    return res.json(rows);
  }

  const result = validateIncidentInput(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  const { title, service, severity, status, description } = result.value;
  const { rows } = await db.query(
    "INSERT INTO incidents (title, service, severity, status, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, service, severity, status, description, reported_at, updated_at",
    [title, service, severity, status, description]
  );
  return res.status(201).json(rows[0]);
}
