INSERT INTO code(id, text_fi, text_en)
VALUES
(('KohteenOmaisuusLuokka', '01'), 'Viheralueet', 'Viheralueet'),
(('KohteenOmaisuusLuokka', '02'), 'Tekniset järjestelmät', 'Tekniset järjestelmät'),
(('KohteenOmaisuusLuokka', '03'), 'Leikkikentät', 'Leikkikentät'),
(('KohteenOmaisuusLuokka', '04'), 'Taitorakenteet', 'Taitorakenteet'),
(('KohteenOmaisuusLuokka', '05'), 'Ympäristörakenteet', 'Ympäristörakenteet'),
(('KohteenOmaisuusLuokka', '06'), 'Satama', 'Satama'),
(
  ('KohteenOmaisuusLuokka', '07'),
  'Tiet, kadut, väylät, torit ja aukiot',
  'Tiet, kadut, väylät, torit ja aukiot'
),
(('KohteenSuhdePeruskiinteistoon', '01'), 'Alapuoleinen', 'Alapuoleinen'),
(('KohteenSuhdePeruskiinteistoon', '02'), 'Maanpinnalla', 'Maanpinnalla'),
(('KohteenSuhdePeruskiinteistoon', '03'), 'Yläpuoleinen', 'Yläpuoleinen'),
(('KohteenMaanomistusLaji', '01'), 'Kunta', 'Kunta'),
(('KohteenMaanomistusLaji', '02'), 'Valtio', 'Valtio'),
(('KohteenMaanomistusLaji', '03'), 'Yksityinen', 'Yksityinen'),
(('KohteenToiminnallinenKayttoTarkoitus', '01'), 'Ajoradat', 'Ajoradat'),
(('KohteenToiminnallinenKayttoTarkoitus', '02'), 'Pyörätiet', 'Pyörätiet'),
(('KohteenToiminnallinenKayttoTarkoitus', '03'), 'Jalkakäytävät', 'Jalkakäytävät'),
(('KohteenToiminnallinenKayttoTarkoitus', '04'), 'Puistot', 'Puistot'),
(('KohteenToiminnallinenKayttoTarkoitus', '05'), 'Raitit', 'Raitit'),
(('KohteenToiminnallinenKayttoTarkoitus', '06'), 'Alueet ja kentät', 'Alueet ja kentät'),
(('KohteenToiminnallinenKayttoTarkoitus', '07'), 'Leikkipaikka', 'Leikkipaikka'),
(
  ('KohteenToiminnallinenKayttoTarkoitus', '08'),
  'Hulevesien käsittelyalueet',
  'Hulevesien käsittelyalueet'
),
(('KohteenToiminnallinenKayttoTarkoitus', '09'), 'Maisemarakenteet', 'Maisemarakenteet'),
(('KohteenToiminnallinenKayttoTarkoitus', '10'), 'Taide', 'Taide'),
(('KohteenToiminnallinenKayttoTarkoitus', '11'), 'Satama', 'Satama'),
(('KohteenToiminnallinenKayttoTarkoitus', '12'), 'Terminaali', 'Terminaali'),
(('KohteenToiminnallinenKayttoTarkoitus', '13'), 'Pysäköintialue', 'Pysäköintialue'),
(('KohteenToiminnallinenKayttoTarkoitus', '14'), 'Toiminnallinen alue', 'Toiminnallinen alue'),
(('KohteenToiminnallinenKayttoTarkoitus', '15'), 'Uimaranta', 'Uimaranta'),
(('KohteenElinkaarentila', '01'), 'Aloittamatta', 'Aloittamatta'),
(('KohteenElinkaarentila', '02'), 'Käynnissä', 'Käynnissä'),
(('KohteenElinkaarentila', '03'), 'Valmis', 'Valmis'),
(('KohteenElinkaarentila', '04'), 'Odottaa', 'Odottaa'),
(('KohdeTyyppi', '01'), 'Peruskorjaaminen', 'Peruskorjaaminen'),
(('KohdeTyyppi', '02'), 'Uudisrakentaminen', 'Uudisrakentaminen'),
(('KohdeTyyppi', '03'), 'Toimivuuden parantaminen', 'Toimivuuden parantaminen');

CREATE TABLE IF NOT EXISTS "project_object" (
  project_id uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_name text NOT NULL,
  description text NOT NULL,
  lifecycle_state code_id NOT NULL CHECK (
    (lifecycle_state).code_list_id = 'KohteenElinkaarentila'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  object_type code_id NOT NULL CHECK (
    (object_type).code_list_id = 'KohdeTyyppi'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  object_category code_id NOT NULL CHECK (
    (object_category).code_list_id = 'KohteenOmaisuusLuokka'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  object_usage code_id NOT NULL CHECK (
    (object_usage).code_list_id = 'KohteenToiminnallinenKayttoTarkoitus'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  person_responsible text NOT NULL,
  created_at timestamptz DEFAULT now(),
  deleted boolean DEFAULT false,
  geom geometry,
  start_date date,
  end_date date,
  landownership code_id CHECK (
    (landownership).code_list_id = 'KohteenMaanomistusLaji'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  location_on_property code_id CHECK (
    (location_on_property).code_list_id = 'KohteenSuhdePeruskiinteistoon'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  height integer,
  updated_by text NOT NULL
);

CREATE INDEX idx_project_object_geom ON project_object USING gist(geom);
CREATE INDEX idx_project_object_project_id ON project_object(project_id);

CREATE TABLE IF NOT EXISTS "project_object_history" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_data jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by text NOT NULL,
  project_object_id uuid NOT NULL REFERENCES project_object(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION project_object_history_trigger()
RETURNS trigger AS $$
DECLARE
    old_row_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_row_json = row_to_json(OLD);
    INSERT INTO "project_object_history" (row_data, updated_by, project_object_id)
    VALUES (old_row_json, OLD.updated_by, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_object_history_trigger
AFTER UPDATE ON project_object
FOR EACH ROW
EXECUTE PROCEDURE project_object_history_trigger();
