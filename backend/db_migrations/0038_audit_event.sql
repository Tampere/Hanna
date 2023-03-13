DROP TRIGGER project_history_trigger ON project;
DROP FUNCTION project_history_trigger();

DROP TRIGGER project_object_history_trigger ON project_object;
DROP FUNCTION project_object_history_trigger();

DROP TRIGGER task_history_trigger ON task;
DROP FUNCTION task_history_trigger();

DROP TRIGGER contractor_company_history_entry_trigger ON contractor_company;
DROP TRIGGER contractor_history_entry_trigger ON contractor;
DROP FUNCTION history_entry_trigger();

ALTER TABLE project_history RENAME TO _deprecated_project_history;
ALTER TABLE project_object_history RENAME TO _deprecated_project_object_history;
ALTER TABLE task_history RENAME TO _deprecated_task_history;
ALTER TABLE history_entry RENAME TO _deprecated_history_entry;

CREATE TABLE audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  event_user TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_metadata JSONB
);
