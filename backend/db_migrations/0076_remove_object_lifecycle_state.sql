UPDATE
    app.project_object
SET
    lifecycle_state = ('(KohteenElinkaarentila,05)')
WHERE
    (lifecycle_state).id = '04';

DELETE FROM
    app.code
WHERE
    id = ('KohteenElinkaarentila', '04') :: app.code_id;