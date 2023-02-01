ALTER TABLE app.project ADD COLUMN updated_by text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "project_history" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_data jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by text NOT NULL,
  project_id uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION project_history_trigger()
RETURNS trigger AS $$
DECLARE
    old_row_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_row_json = row_to_json(OLD);
    INSERT INTO app.project_history (row_data, updated_by, project_id)
    VALUES (old_row_json, OLD.updated_by, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_history_trigger
AFTER UPDATE ON project
FOR EACH ROW
EXECUTE PROCEDURE project_history_trigger();
