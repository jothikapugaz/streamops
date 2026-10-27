import { db } from "hatchable";

export const access = "public";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  if (req.method === "GET") {
    const { rows } = await db.query(
      "SELECT id, title, type, genre, region, availability, release_date, created_at FROM titles ORDER BY created_at DESC, title ASC"
    );
    return res.json(rows);
  }

  const body = req.body || {};
  const title = String(body.title || "").trim();
  const type = String(body.type || "Series");
  const genre = String(body.genre || "").trim();
  const region = String(body.region || "Global");
  const availability = String(body.availability || "Under Review");
  const releaseDate = body.release_date ? String(body.release_date) : null;
  const allowedTypes = ["Series", "Film", "Documentary", "Special"];
  const allowedAvailability = ["Available", "Coming Soon", "Under Review"];
  const allowedRegions = ["Global", "Asia-Pacific", "Europe", "North America", "India"];

  if (!title || !genre) return res.status(400).json({ error: "Title name and genre are required." });
  if (!allowedTypes.includes(type)) return res.status(400).json({ error: "Choose a valid content type." });
  if (!allowedAvailability.includes(availability)) return res.status(400).json({ error: "Choose a valid availability status." });
  if (!allowedRegions.includes(region)) return res.status(400).json({ error: "Choose a valid region." });
  if (title.length > 160 || genre.length > 80) return res.status(400).json({ error: "The title or genre is too long." });

  const { rows } = await db.query(
    "INSERT INTO titles (title, type, genre, region, availability, release_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, type, genre, region, availability, release_date, created_at",
    [title, type, genre, region, availability, releaseDate]
  );
  return res.status(201).json(rows[0]);
}