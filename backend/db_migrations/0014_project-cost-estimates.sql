CREATE TABLE cost_estimate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER,
  amount BIGINT,
  project_id UUID,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
)
