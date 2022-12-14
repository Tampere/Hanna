ALTER TABLE app.project ADD COLUMN IF NOT EXISTS lifecycle_state text NOT NULL DEFAULT '01';
