INSERT INTO
    APP.code
VALUES
    (
        ('HankkeenSitovuus', '01'),
        'Peruskaupunki',
        'Peruskaupunki'
    ),
    (
        ('HankkeenSitovuus', '02'),
        'Viiden tähden keskusta',
        'Viiden tähden keskusta'
    ),
    (
        ('HankkeenSitovuus', '03'),
        'Hiedanranta',
        'Hiedanranta'
    ),
    (
        ('KohteenToiminnallinenKayttoTarkoitus', '23'),
        'Hulevesiviemäri',
        'Hulevesiviemäri'
    ),
    (
        ('KohteenToiminnallinenKayttoTarkoitus', '24'),
        'Oja',
        'Oja'
    );

ALTER TABLE
    app.project_investment
ADD
    COLUMN target app.code_id DEFAULT ('HankkeenSitovuus', '01');