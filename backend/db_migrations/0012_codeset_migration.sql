CREATE TYPE code_id AS (code_list_id text, id text);

CREATE TABLE code_new (
  id code_id PRIMARY KEY,
  text_fi text NOT NULL,
  text_en text NOT NULL
);

-- migrate existing codes to codeset
INSERT INTO code_new
SELECT
  (code_list_id, id)::code_id,
  text_fi,
  text_en
FROM code;

-- migrate existing project codes
ALTER TABLE project RENAME lifecycle_state TO lifecycle_state_old;
ALTER TABLE project ADD COLUMN lifecycle_state app.code_id CHECK (
  (lifecycle_state).code_list_id = 'HankkeenElinkaarentila'
) REFERENCES app.code_new (id);

UPDATE app.project
SET lifecycle_state = ('HankkeenElinkaarentila', project.lifecycle_state_old)
WHERE project.lifecycle_state_old IS NOT NULL;

ALTER TABLE app.project ALTER COLUMN lifecycle_state SET NOT NULL;
ALTER TABLE app.project DROP COLUMN lifecycle_state_old;

ALTER TABLE code RENAME TO code_old;
ALTER TABLE code_new RENAME TO code;
DROP TABLE code_old;
