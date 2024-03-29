CREATE TABLE "project_common" (
  id uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  lifecycle_state app.code_id NOT NULL REFERENCES app.code(id) ON DELETE RESTRICT,
  project_type app.code_id NOT NULL REFERENCES app.code(id) ON DELETE RESTRICT,
  person_in_charge text NOT NULL REFERENCES app."user"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT project_common_lifecycle_state_check CHECK (
    (lifecycle_state) .code_list_id = 'HankkeenElinkaarentila'::text
  ),
  CONSTRAINT project_common_type_check CHECK ((project_type) .code_list_id = 'HankeTyyppi'::text),
  CONSTRAINT project_common_date_check CHECK (start_date < end_date),
  PRIMARY KEY (id)
);

-- select all projects and create a new project_common for each
INSERT INTO app.project_common
(id, start_date, end_date, lifecycle_state, project_type, person_in_charge)
SELECT
  id,
  start_date,
  end_date,
  lifecycle_state,
  project_type,
  person_in_charge
FROM app.project;

-- drop old columns from project that are moved to project common
ALTER TABLE app.project
DROP COLUMN start_date,
DROP COLUMN end_date,
DROP COLUMN lifecycle_state,
DROP COLUMN project_type,
DROP COLUMN person_in_charge;

INSERT INTO app.code(id, text_fi, text_en)
VALUES
(('AsemakaavaHanketyyppi', '01'), 'Asemakaava', 'Asemakaava'),
(('AsemakaavaHanketyyppi', '02'), 'Asemakaavamuutos', 'Asemakaavamuutos'),
(('AsemakaavaHanketyyppi', '03'), 'Yleissuunnitelma', 'Yleissuunnitelma');

INSERT INTO app.code(id, text_fi, text_en)
VALUES
(('AsemakaavaSuunnittelualue', '01'), 'Länsi', 'Länsi'),
(('AsemakaavaSuunnittelualue', '02'), 'Keskusta', 'Keskusta'),
(('AsemakaavaSuunnittelualue', '03'), 'Itä', 'Itä'),
(('AsemakaavaSuunnittelualue', '04'), 'Etelä', 'Etelä');

CREATE SEQUENCE app.detailplan_id_seq AS int;

CREATE TABLE "project_detailplan" (
  id uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
  diary_id text,
  diary_date date,
  subtype app.code_id REFERENCES app.code(id) ON DELETE RESTRICT,
  CONSTRAINT project_detailplan_subtype_check CHECK (
    (subtype) .code_list_id = 'AsemakaavaHanketyyppi'::text
  ),
  planning_zone app.code_id REFERENCES app.code(id) ON DELETE RESTRICT,
  CONSTRAINT planning_zone_check CHECK (
    (planning_zone) .code_list_id = 'AsemakaavaSuunnittelualue'::text
  ),
  preparer text REFERENCES app."user"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  technical_planner text REFERENCES app."user"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  district text,
  block_name text,
  address_text text,
  detailplan_id int DEFAULT nextval('app.detailplan_id_seq'),
  initiative_date date,
  applicant_name text,
  applicant_address text,
  applicant_objective text,
  additional_info text,
  PRIMARY KEY (id)
);
