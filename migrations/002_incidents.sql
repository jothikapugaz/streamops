CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY DEFAULT ('INC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  service TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Low' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Resolved')),
  description TEXT NOT NULL DEFAULT '',
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);