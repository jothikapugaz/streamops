CREATE TABLE IF NOT EXISTS titles (
  id TEXT PRIMARY KEY DEFAULT ('TIT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  type TEXT NOT NULL CHECK (type IN ('Series', 'Film', 'Documentary', 'Special')),
  genre TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Global',
  availability TEXT NOT NULL DEFAULT 'Under Review' CHECK (availability IN ('Available', 'Coming Soon', 'Under Review')),
  release_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);