CREATE TABLE app.project_maintenance (
	id uuid REFERENCES app.project(id) ON DELETE CASCADE
);