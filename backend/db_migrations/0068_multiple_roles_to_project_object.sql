ALTER TABLE app.project_object_user_role DROP CONSTRAINT project_object_role_unique_object_id_role;
ALTER TABLE app.project_object_user_role ADD company_contact_id uuid REFERENCES app.company_contact(id);
ALTER TABLE app.project_object_user_role ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE app.project_object_user_role
    ADD CONSTRAINT check_ids_not_both_null
    CHECK (user_id IS NOT NULL OR company_contact_id IS NOT NULL);
INSERT INTO app.code (id, text_fi, text_en) VALUES('(KohdeKayttajaRooli,06)', 'Urakoitsijan edustaja', 'Urakoitsijan edustaja');
INSERT INTO app.code (id, text_fi, text_en) VALUES('(KohdeKayttajaRooli,07)', 'Turvallisuuskoordinaattori', 'Turvallisuuskoordinaattori');
INSERT INTO app.code (id, text_fi, text_en) VALUES('(KohdeKayttajaRooli,08)', 'Valvoja', 'Valvoja');

INSERT INTO app.project_object_user_role (project_object_id, role, company_contact_id)
	SELECT DISTINCT t.project_object_id, '(KohdeKayttajaRooli,06)'::app.code_id, t.contractor_id FROM app.task t
	WHERE t.contractor_id IS NOT NULL;

ALTER TABLE app.task DROP COLUMN contractor_id;