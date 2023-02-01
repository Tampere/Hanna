ALTER TABLE cost_estimate
ADD COLUMN task_id UUID,
ADD CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE;

UPDATE cost_estimate
SET project_id = NULL
WHERE project_object_id IS NOT NULL
  AND project_id IS NOT NULL;
