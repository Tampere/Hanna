CREATE TABLE "project_relation" (
  project_id uuid NOT NULL,
  target_project_id uuid NOT NULL,
  relation_type varchar NOT NULL,
  CONSTRAINT pk_project_relation PRIMARY KEY (project_id, target_project_id),
  CONSTRAINT fk_project_id FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
  CONSTRAINT fk_target_project_id FOREIGN KEY (
    target_project_id
  ) REFERENCES project(id) ON DELETE CASCADE,
  CONSTRAINT check_project_relation_type CHECK (relation_type IN ('relates_to', 'is_parent_of'))
);
