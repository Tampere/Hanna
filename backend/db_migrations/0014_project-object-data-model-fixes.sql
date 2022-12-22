-- recreate function and trigger to include the table name schema in the insert
CREATE OR REPLACE FUNCTION project_object_history_trigger()
RETURNS trigger AS $$
DECLARE
    old_row_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_row_json = row_to_json(OLD);
    INSERT INTO app.project_object_history (row_data, updated_by, project_object_id)
    VALUES (old_row_json, OLD.updated_by, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER project_object_history_trigger ON project_object;

CREATE TRIGGER project_object_history_trigger
AFTER UPDATE ON project_object
FOR EACH ROW
EXECUTE PROCEDURE project_object_history_trigger();
