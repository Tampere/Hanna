ALTER TABLE app.budget ADD COLUMN forecast BIGINT;
ALTER TABLE app.budget ADD COLUMN kayttosuunnitelman_muutos BIGINT;
ALTER TABLE app.budget DROP COLUMN id;

-- for upsertions
CREATE UNIQUE INDEX budget_project_object_id_year_idx ON app.budget (project_object_id, year);