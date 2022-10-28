CREATE TABLE IF NOT EXISTS app.project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  description text NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (start_date < end_date),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  geom geometry
);
