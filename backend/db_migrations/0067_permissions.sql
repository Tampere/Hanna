CREATE TABLE project_permission (
    project_id uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES app.user(id) ON DELETE CASCADE,
    can_write boolean NOT NULL DEFAULT FALSE,
    PRIMARY KEY (project_id, user_id)
);

ALTER TABLE app.user ADD COLUMN role text;
ALTER TABLE app.user ADD COLUMN permissions text[] DEFAULT '{}'::text[];
