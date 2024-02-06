INSERT INTO app.code (id, text_fi, text_en) VALUES('(KohteenLaji,01)', 'Suunnittelu', 'Suunnittelu');
INSERT INTO app.code (id, text_fi, text_en) VALUES('(KohteenLaji,02)', 'Rakentaminen', 'Rakentaminen');

ALTER TABLE app.project_object ADD COLUMN object_stage app.code_id CHECK (
  (object_stage).code_list_id = 'KohteenLaji'
) REFERENCES app.code (id);
UPDATE app.project_object SET object_stage = ('KohteenLaji', '02');
ALTER TABLE app.project ALTER COLUMN lifecycle_state SET NOT NULL;