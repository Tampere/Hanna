DELETE FROM app.project_object_user_role pour
WHERE (pour.role).code_list_id = 'KohdeKayttajaRooli' AND (pour.role).id = ANY('{04, 03}');

DELETE FROM app.code c WHERE (c.id).code_list_id = 'KohdeKayttajaRooli' AND (c.id).id = '03';
DELETE FROM app.code c WHERE (c.id).code_list_id = 'KohdeKayttajaRooli' AND (c.id).id = '04';

INSERT INTO app.code VALUES (('KohdeKayttajaRooli', '09'), 'Vastaava työnjohtaja', 'Vastaava työnjohtaja');
INSERT INTO app.code VALUES (('KohdeKayttajaRooli', '10'), 'Suunnittelun edustaja', 'Suunnittelun edustaja');