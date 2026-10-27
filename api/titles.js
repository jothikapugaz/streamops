import { db } from "hatchable";
import { validateTitleInput } from "lib/validation.js";

export const access = "public";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  if (req.method === "GET") {
    const { rows } = await db.query(
      "SELECT id, title, type, genre, region, availability, release_date, created_at FROM titles ORDER BY created_at DESC, title ASC"
    );
    return res.json(rows);
  }

  const result = validateTitleInput(req.body || {});
  if (result.error) return res.status(400).json({ error: result.error });

  const { title, type, genre, region, availability, releaseDate } = result.value;
  const { rows } = await db.query(
    "INSERT INTO titles (title, type, genre, region, availability, release_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, type, genre, region, availability, release_date, created_at",
    [title, type, genre, region, availability, releaseDate]
  );
  return res.status(201).json(rows[0]);
}
