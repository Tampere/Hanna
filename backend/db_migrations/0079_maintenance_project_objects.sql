CREATE TABLE app.project_object_maintenance (
    project_object_id uuid PRIMARY KEY REFERENCES app.project_object (id),
    contract TEXT,
    purchase_order_number TEXT,
    procurement_method app.code_id CHECK (
        (procurement_method).code_list_id = 'KohteenToteutustapa'
    ) REFERENCES app.code (id)
);

CREATE TABLE app.project_object_investment (
    project_object_id uuid PRIMARY KEY REFERENCES app.project_object (id),
    object_stage app.code_id NOT NULL CHECK (
        (object_stage).code_list_id = 'KohteenLaji'
    ) REFERENCES app.code (id),
    suunnitteluttaja_user text REFERENCES app.user(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    rakennuttaja_user text REFERENCES app.user(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO
    app.project_object_investment (
        project_object_id,
        object_stage,
        suunnitteluttaja_user,
        rakennuttaja_user
    )
SELECT
    id AS "project_object_id",
    object_stage,
    suunnitteluttaja_user,
    rakennuttaja_user
FROM
    app.project_object
WHERE
    object_stage IS NOT NULL;

INSERT INTO
    app.code (id, text_fi, text_en)
VALUES
    (
        ('KohteenToteutustapa', '01'),
        'Puitesopimus',
        'Puitesopimus'
    ),
    (
        ('KohteenToteutustapa', '02'),
        'Kilpailutus',
        'Kilpailutus'
    ),
    (
        ('KohteenToteutustapa', '03'),
        'Suorahankinta',
        'Suorahankinta'
    );

ALTER TABLE
    app.project_object DROP COLUMN object_stage,
    DROP COLUMN suunnitteluttaja_user,
    DROP COLUMN rakennuttaja_user;