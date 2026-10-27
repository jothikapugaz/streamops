import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  if (req.method === "GET") {
    const { rows } = await db.query("SELECT id, title, service, severity, status, description, reported_at, updated_at FROM incidents ORDER BY CASE status WHEN 'Open' THEN 1 WHEN 'Investigating' THEN 2 ELSE 3 END, CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, updated_at DESC");
    return res.json(rows);
  }
  const body = req.body || {};
  const title = String(body.title || "").trim();
  const service = String(body.service || "").trim();
  const severity = String(body.severity || "Low");
  const status = String(body.status || "Open");
  const description = String(body.description || "").trim();
  const allowedSeverity = ["Critical", "High", "Medium", "Low"];
  const allowedStatus = ["Open", "Investigating", "Resolved"];
  const allowedServices = ["Playback API", "Content API", "Authentication", "Recommendations", "Web application", "Mobile app"];
  if (!title || !service) return res.status(400).json({ error: "Incident title and affected service are required." });
  if (!allowedSeverity.includes(severity)) return res.status(400).json({ error: "Choose a valid severity." });
  if (!allowedStatus.includes(status)) return res.status(400).json({ error: "Choose a valid status." });
  if (!allowedServices.includes(service)) return res.status(400).json({ error: "Choose a valid service." });
  if (title.length > 120 || description.length > 1000) return res.status(400).json({ error: "The title or description is too long." });
  const { rows } = await db.query("INSERT INTO incidents (title, service, severity, status, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, service, severity, status, description, reported_at, updated_at", [title, service, severity, status, description]);
  return res.status(201).json(rows[0]);
}