ALTER TABLE cost_estimate
ADD COLUMN project_object_id UUID,
  ADD CONSTRAINT fk_project_object FOREIGN KEY (project_object_id) REFERENCES project_object(id) ON DELETE CASCADE;
