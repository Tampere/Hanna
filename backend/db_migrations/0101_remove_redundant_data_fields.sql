ALTER TABLE
    app.project_object DROP height;

DELETE FROM
    app.code
WHERE
    (id).code_list_id = 'KohteenMaanomistusLaji';

DELETE FROM
    app.code
WHERE
    (id).code_list_id = 'KohteenSuhdePeruskiinteistoon'