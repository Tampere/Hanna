CREATE TABLE app.code (
  code_list_id TEXT NOT NULL,
  id TEXT NOT NULL,
  text_fi TEXT,
  text_en TEXT,
  PRIMARY KEY (code_list_id, id)
);
INSERT INTO app.code (code_list_id, id, text_fi, text_en)
VALUES (
    'Rahoitusmalli',
    '01',
    'Jälkirahoitus',
    'Jälkirahoitus'
  ),
  (
    'Rahoitusmalli',
    '02',
    'Kehittämiskorvaus',
    'Kehittämiskorvaus'
  ),
  (
    'Rahoitusmalli',
    '03',
    'Lautakunnan vuosisuunnitelma',
    'Lautakunnan vuosisuunnitelma'
  ),
  (
    'Rahoitusmalli',
    '04',
    'Strateginen ohjelma',
    'Strateginen ohjelma'
  ),
  (
    'Rahoitusmalli',
    '05',
    'Taseyksikkö',
    'Taseyksikkö'
  ),
  (
    'Rahoitusmalli',
    '06',
    'Valtion tuki',
    'Valtion tuki'
  ),
  (
    'Rahoitusmalli',
    '07',
    'Yhteisrahoitus',
    'Yhteisrahoitus'
  ),
  ('Hanketyyppi', '01', 'Asemakaava', 'Asemakaava'),
  (
    'Hanketyyppi',
    '02',
    'Asemakaavaohjelma',
    'Asemakaavaohjelma'
  ),
  (
    'Hanketyyppi',
    '03',
    'Investointiohjelma',
    'Investointiohjelma'
  ),
  (
    'Hanketyyppi',
    '04',
    'Kaupunkikehittämisohjelma',
    'Kaupunkikehittämisohjelma'
  ),
  (
    'Hanketyyppi',
    '05',
    'Strateginen ohjelma',
    'Strateginen ohjelma'
  ),
  (
    'Hanketyyppi',
    '06',
    'Suorainvestointihanke',
    'Suorainvestointihanke'
  ),
  ('Hanketyyppi', '07', 'Yleiskaava', 'Yleiskaava'),
  (
    'Hanketyyppi',
    '08',
    'Yleiskaavaohjelma',
    'Yleiskaavaohjelma'
  ),
  (
    'LiittyvanHankkeenTyyppi',
    '01',
    'Alahanke',
    'Alahanke'
  ),
  (
    'LiittyvanHankkeenTyyppi',
    '02',
    'Ylähanke',
    'Ylähanke'
  ),
  (
    'LiittyvanHankkeenTyyppi',
    '03',
    'Sidoshanke',
    'Sidoshanke'
  ),
  (
    'HankkeenElinkaarentila',
    '01',
    'Aloittamatta',
    'Aloittamatta'
  ),
  (
    'HankkeenElinkaarentila',
    '02',
    'Käynnissä',
    'Käynnissä'
  ),
  (
    'HankkeenElinkaarentila',
    '03',
    'Valmis',
    'Valmis'
  ),
  (
    'HankkeenElinkaarentila',
    '04',
    'Odottaa',
    'Odottaa'
  ),
  (
    'HankkeenToimielin',
    '01',
    'Yhdyskuntalautakunta',
    'Yhdyskuntalautakunta'
  ),
  (
    'HankkeenToimielin',
    '02',
    'Sosiaali- ja terveyslautakunta',
    'Sosiaali- ja terveyslautakunta'
  ),
  (
    'HankkeenToimielin',
    '03',
    'Sivistys- ja kulttuurilautakunta',
    'Sivistys- ja kulttuurilautakunta'
  ),
  (
    'HankkeenToimielin',
    '04',
    'Elinvoima- ja osaamislautakunta',
    'Elinvoima- ja osaamislautakunta'
  ),
  (
    'HankkeenToimielin',
    '05',
    'Asunto- ja kiinteistölautakunta',
    'Asunto- ja kiinteistölautakunta'
  ),
  (
    'HankkeenToimielin',
    '06',
    'Alueellinen jätehuoltolautakunta',
    'Alueellinen jätehuoltolautakunta'
  ),
  (
    'HankkeenToimielin',
    '07',
    'Tampereen kaupunkiseudun joukkoliikennelautakunta',
    'Tampereen kaupunkiseudun joukkoliikennelautakunta'
  ),
  (
    'HankkeenToimielin',
    '08',
    'Tarkastuslautakunta',
    'Tarkastuslautakunta'
  ),
  (
    'HankkeenToimielin',
    '09',
    'Keskusvaalilautakunta',
    'Keskusvaalilautakunta'
  ),
  (
    'HankkeenToimielin',
    '10',
    'Kaupunginhallitus',
    'Kaupunginhallitus'
  ),
  (
    'HankkeenToimielin',
    '11',
    'Viranhaltija(-päätös)',
    'Viranhaltija(-päätös)'
  );
