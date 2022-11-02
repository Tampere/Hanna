CREATE TABLE IF NOT EXISTS app.project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  project_name text NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  geom geometry
);
