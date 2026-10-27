export function validateTitleInput(body = {}) {
  const title = String(body.title || "").trim();
  const type = String(body.type || "Series");
  const genre = String(body.genre || "").trim();
  const region = String(body.region || "Global");
  const availability = String(body.availability || "Under Review");
  const releaseDate = body.release_date ? String(body.release_date) : null;

  const allowedTypes = ["Series", "Film", "Documentary", "Special"];
  const allowedAvailability = ["Available", "Coming Soon", "Under Review"];
  const allowedRegions = ["Global", "Asia-Pacific", "Europe", "North America", "India"];

  if (!title || !genre) return { error: "Title name and genre are required." };
  if (!allowedTypes.includes(type)) return { error: "Choose a valid content type." };
  if (!allowedAvailability.includes(availability)) return { error: "Choose a valid availability status." };
  if (!allowedRegions.includes(region)) return { error: "Choose a valid region." };
  if (title.length > 160 || genre.length > 80) return { error: "The title or genre is too long." };

  return { value: { title, type, genre, region, availability, releaseDate } };
}

export function validateIncidentInput(body = {}) {
  const title = String(body.title || "").trim();
  const service = String(body.service || "").trim();
  const severity = String(body.severity || "Low");
  const status = String(body.status || "Open");
  const description = String(body.description || "").trim();

  const allowedSeverity = ["Critical", "High", "Medium", "Low"];
  const allowedStatus = ["Open", "Investigating", "Resolved"];
  const allowedServices = ["Playback API", "Content API", "Authentication", "Recommendations", "Web application", "Mobile app"];

  if (!title || !service) return { error: "Incident title and affected service are required." };
  if (!allowedSeverity.includes(severity)) return { error: "Choose a valid severity." };
  if (!allowedStatus.includes(status)) return { error: "Choose a valid status." };
  if (!allowedServices.includes(service)) return { error: "Choose a valid service." };
  if (title.length > 120 || description.length > 1000) return { error: "The title or description is too long." };

  return { value: { title, service, severity, status, description } };
}

export function validateIncidentStatus(status) {
  return ["Open", "Investigating", "Resolved"].includes(status)
    ? null
    : "Choose Open, Investigating, or Resolved.";
}
