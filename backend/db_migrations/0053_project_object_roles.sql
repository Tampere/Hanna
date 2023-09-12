ALTER TABLE app.project_object ADD COLUMN suunnittelluttaja_user TEXT REFERENCES app."user" (id);
ALTER TABLE app.project_object ADD COLUMN rakennuttaja_user TEXT REFERENCES app."user" (id);

-- migrate project_object.person_in_charge to suunnitteluttaja user and rakennuttaja user
UPDATE app.project_object
SET
  suunnittelluttaja_user = person_in_charge,
  rakennuttaja_user = person_in_charge
WHERE person_in_charge IS NOT NULL;

ALTER TABLE app.project_object ALTER COLUMN suunnittelluttaja_user SET NOT NULL;
ALTER TABLE app.project_object ALTER COLUMN rakennuttaja_user SET NOT NULL;

-- person_in_charge is not used anymore
ALTER TABLE app.project_object DROP COLUMN person_in_charge;

INSERT INTO app.code (id, text_fi, text_en)
VALUES
-- reserve 01 and 02 for suunnitteluttaja and rakennuttaja if data model changes in the future
(('KohdeKayttajaRooli', '03'), 'Turvallisuuspäällikkö', 'Turvallisuuspäällikkö'),
(('KohdeKayttajaRooli', '04'), 'Projektinjohtaja', 'Projektinjohtaja');

CREATE TABLE app.project_object_user_role
(
  user_id TEXT NOT NULL REFERENCES app."user" (id),
  project_object_id UUID NOT NULL REFERENCES app.project_object (id),
  "role" app .code_id NOT NULL
      REFERENCES app.code (id) ON DELETE RESTRICT
      CONSTRAINT project_object_user_role_role_check
          CHECK (("role").code_list_id = 'KohdeKayttajaRooli'::text),
  -- project object can contain only one of each role
  CONSTRAINT project_object_role_unique_object_id_role UNIQUE (project_object_id, "role")
);
