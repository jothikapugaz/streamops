import { db } from "hatchable";

export const access = "public";
export const methods = ["PUT"];

export default async function (req, res) {
  const id = String(req.params.id || "").trim();
  const status = String((req.body || {}).status || "");
  const allowedStatus = ["Open", "Investigating", "Resolved"];

  if (!id) return res.status(400).json({ error: "An incident ID is required." });
  if (!allowedStatus.includes(status)) return res.status(400).json({ error: "Choose Open, Investigating, or Resolved." });

  const { rows } = await db.query(
    "UPDATE incidents SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, title, service, severity, status, description, reported_at, updated_at",
    [status, id]
  );
  if (!rows.length) return res.status(404).json({ error: "Incident not found." });
  return res.json(rows[0]);
}