ALTER TABLE
    app.project_object DROP height,
    DROP landownership,
    DROP location_on_property;

DELETE FROM
    app.code
WHERE
    (id).code_list_id = 'KohteenMaanomistusLaji';

DELETE FROM
    app.code
WHERE
    (id).code_list_id = 'KohteenSuhdePeruskiinteistoon'