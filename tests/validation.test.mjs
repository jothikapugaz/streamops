import test from "node:test";
import assert from "node:assert/strict";
import {
  validateTitleInput,
  validateIncidentInput,
  validateIncidentStatus
} from "../lib/validation.js";

test("accepts a valid title, trims whitespace, and applies defaults", () => {
  const result = validateTitleInput({ title: "  Example Film  ", genre: " Sci-Fi " });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.value, {
    title: "Example Film",
    type: "Series",
    genre: "Sci-Fi",
    region: "Global",
    availability: "Under Review",
    releaseDate: null
  });
});

test("rejects a title when title or genre is missing", () => {
  assert.equal(validateTitleInput({ title: "Only title" }).error, "Title name and genre are required.");
  assert.equal(validateTitleInput({ genre: "Drama" }).error, "Title name and genre are required.");
});

test("rejects unsupported title type, availability, and region", () => {
  assert.equal(validateTitleInput({ title: "A", genre: "B", type: "Podcast" }).error, "Choose a valid content type.");
  assert.equal(validateTitleInput({ title: "A", genre: "B", availability: "Archived" }).error, "Choose a valid availability status.");
  assert.equal(validateTitleInput({ title: "A", genre: "B", region: "Mars" }).error, "Choose a valid region.");
});

test("rejects titles and genres that exceed their length limits", () => {
  assert.equal(validateTitleInput({ title: "x".repeat(161), genre: "Drama" }).error, "The title or genre is too long.");
  assert.equal(validateTitleInput({ title: "Film", genre: "x".repeat(81) }).error, "The title or genre is too long.");
});

test("accepts a valid incident and applies defaults", () => {
  const result = validateIncidentInput({ title: "Playback issue", service: "Playback API" });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.value, {
    title: "Playback issue",
    service: "Playback API",
    severity: "Low",
    status: "Open",
    description: ""
  });
});

test("rejects incidents with missing title or service", () => {
  assert.equal(validateIncidentInput({ title: "Issue" }).error, "Incident title and affected service are required.");
  assert.equal(validateIncidentInput({ service: "Playback API" }).error, "Incident title and affected service are required.");
});

test("rejects unsupported incident severity, status, and service", () => {
  assert.equal(validateIncidentInput({ title: "Issue", service: "Playback API", severity: "Extreme" }).error, "Choose a valid severity.");
  assert.equal(validateIncidentInput({ title: "Issue", service: "Playback API", status: "Pending" }).error, "Choose a valid status.");
  assert.equal(validateIncidentInput({ title: "Issue", service: "Unknown" }).error, "Choose a valid service.");
});

test("rejects incidents that exceed title or description limits", () => {
  assert.equal(validateIncidentInput({ title: "x".repeat(121), service: "Playback API" }).error, "The title or description is too long.");
  assert.equal(validateIncidentInput({ title: "Issue", service: "Playback API", description: "x".repeat(1001) }).error, "The title or description is too long.");
});

test("accepts only the supported incident update statuses", () => {
  assert.equal(validateIncidentStatus("Open"), null);
  assert.equal(validateIncidentStatus("Investigating"), null);
  assert.equal(validateIncidentStatus("Resolved"), null);
  assert.equal(validateIncidentStatus("Pending"), "Choose Open, Investigating, or Resolved.");
});
