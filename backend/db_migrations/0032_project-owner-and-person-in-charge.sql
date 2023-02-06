ALTER TABLE project
  ADD COLUMN owner TEXT,
  ADD COLUMN person_in_charge TEXT;
  
-- Update existing rows from updated_by or the first existing user before applying constraints.
UPDATE project SET
  owner = CASE WHEN updated_by IS NOT NULL AND updated_by != ''
    THEN updated_by
    else (SELECT id FROM "user" LIMIT 1)
  END,
  person_in_charge = CASE WHEN updated_by IS NOT NULL AND updated_by != ''
    THEN updated_by
    ELSE (SELECT id FROM "user" LIMIT 1)
  END;
  
-- Finally add the constraints
ALTER TABLE project
  ALTER COLUMN owner SET NOT NULL,
  ALTER COLUMN person_in_charge SET NOT NULL,
  ADD CONSTRAINT project_owner
    FOREIGN KEY (owner) REFERENCES "user"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  ADD CONSTRAINT project_person_in_charge
    FOREIGN KEY (person_in_charge) REFERENCES "user"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
