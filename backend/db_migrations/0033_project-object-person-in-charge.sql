ALTER TABLE project_object RENAME COLUMN person_responsible TO person_in_charge;

UPDATE project_object SET person_in_charge = (SELECT id FROM "user" LIMIT 1);

ALTER TABLE project_object
  ADD CONSTRAINT project_object_person_in_charge
    FOREIGN KEY (person_in_charge) REFERENCES "user"(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
