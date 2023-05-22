-- Create new tables for storing multiple values
CREATE TABLE project_object_category (
  project_object_id uuid NOT NULL REFERENCES project_object (
    id
  ) ON DELETE CASCADE,
  object_category code_id NOT NULL CHECK (
    (object_category).code_list_id = 'KohteenOmaisuusLuokka'
  ) REFERENCES code (id) ON DELETE RESTRICT,
  PRIMARY KEY (project_object_id, object_category)
);
CREATE TABLE project_object_usage (
  project_object_id uuid NOT NULL REFERENCES project_object (
    id
  ) ON DELETE CASCADE,
  object_usage code_id NOT NULL CHECK (
    (object_usage).code_list_id = 'KohteenToiminnallinenKayttoTarkoitus'
  ) REFERENCES code (id) ON DELETE RESTRICT,
  PRIMARY KEY (project_object_id, object_usage)
);
CREATE TABLE project_object_type (
  project_object_id uuid NOT NULL REFERENCES project_object (
    id
  ) ON DELETE CASCADE,
  object_type code_id NOT NULL CHECK (
    (object_type).code_list_id = 'KohdeTyyppi'
  ) REFERENCES code (id) ON DELETE RESTRICT,
  PRIMARY KEY (project_object_id, object_type)
);

-- Migrate existing values to the new tables
INSERT INTO project_object_category (project_object_id, object_category)
SELECT
  id,
  object_category
FROM project_object;
INSERT INTO project_object_usage (project_object_id, object_usage)
SELECT
  id,
  object_usage
FROM project_object;
INSERT INTO project_object_type (project_object_id, object_type)
SELECT
  id,
  object_type
FROM project_object;

-- Remove old columns
ALTER TABLE project_object DROP COLUMN object_category;
ALTER TABLE project_object DROP COLUMN object_usage;
ALTER TABLE project_object DROP COLUMN object_type;
