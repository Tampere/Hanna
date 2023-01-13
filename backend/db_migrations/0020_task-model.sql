CREATE TABLE IF NOT EXISTS "task" (
  project_object_id uuid NOT NULL REFERENCES project_object(id) ON DELETE CASCADE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  lifecycle_state code_id NOT NULL CHECK (
    (lifecycle_state).code_list_id = 'TehtävänElinkaarentila'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  task_type code_id NOT NULL CHECK (
    (task_type).code_list_id = 'TehtäväTyyppi'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false,
  updated_by text NOT NULL
);

CREATE INDEX idx_task_project_object_id ON task(project_object_id);

CREATE TABLE IF NOT EXISTS "task_history" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_data jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by text NOT NULL,
  task_id uuid NOT NULL REFERENCES task(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION task_history_trigger()
RETURNS trigger AS $$
DECLARE
    old_row_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_row_json = row_to_json(OLD);
    INSERT INTO "task_history" (row_data, updated_by, project_object_id)
    VALUES (old_row_json, OLD.updated_by, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_history_trigger
AFTER UPDATE ON task
FOR EACH ROW
EXECUTE PROCEDURE task_history_trigger();