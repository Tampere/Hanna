INSERT INTO code(id, text_fi, text_en)
VALUES
(('HankeTyyppi', '01'), 'Yleiskaava', 'Yleiskaava'),
(('HankeTyyppi', '02'), 'Hankekehitys', 'Hankekehitys'),
(('HankeTyyppi', '03'), 'Asemakaava', 'Asemakaava'),
(('HankeTyyppi', '04'), 'Investointihanke', 'Investointihanke'),
(('HankeTyyppi', '05'), 'Ylläpito', 'Ylläpito'),
(('Lautakunta', '01'), 'Yhdyskuntalautakunta', 'Yhdyskuntalautakunta'),
(('Lautakunta', '02'), 'Asunto- ja kiinteistölautakunta', 'Asunto- ja kiinteistölautakunta'),
(('Lautakunta', '03'), 'Elinkeino- ja osaamislautakunta', 'Elinkeino- ja osaamislautakunta'),
(('Lautakunta', '04'), 'Joukkoliikennelautakunta', 'Joukkoliikennelautakunta');

ALTER TABLE project ADD COLUMN project_type code_id;

-- set existing projects to have project type before adding constraint
UPDATE project
SET project_type = ('HankeTyyppi', '02');

-- remove now obsolete code list that is replaced with more up to date value set
DELETE FROM code
WHERE (id).code_list_id = 'Hanketyyppi';

ALTER TABLE project ALTER COLUMN project_type SET NOT NULL;

ALTER TABLE project ADD CONSTRAINT project_type_check CHECK (
  (project_type).code_list_id = 'HankeTyyppi'
);

ALTER TABLE project ADD CONSTRAINT project_type_fk FOREIGN KEY (project_type)
REFERENCES code(id) ON DELETE RESTRICT;

CREATE TABLE project_committee (
  project_id uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  committee_type code_id NOT NULL CHECK (
    (committee_type).code_list_id = 'Lautakunta'
  ) REFERENCES code(id) ON DELETE RESTRICT,
  PRIMARY KEY (project_id, committee_type)
);
