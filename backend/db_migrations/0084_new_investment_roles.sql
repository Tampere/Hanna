INSERT INTO
    app.code
VALUES
    (
        ('InvestointiKohdeKayttajaRooli', '01'),
        'Rakennuttaja',
        'Rakennuttaja'
    ),
    (
        ('InvestointiKohdeKayttajaRooli', '02'),
        'Suunnitteluttaja',
        'Suunnitteluttaja'
    );

ALTER TABLE
    app.project_object_user_role DROP CONSTRAINT project_object_user_role_role_check;

ALTER TABLE
    app.project_object_user_role
ADD
    CONSTRAINT project_object_user_role_role_check CHECK (
        (
            (role).code_list_id = ANY(
                ARRAY ['KohdeKayttajaRooli'::TEXT, 'InvestointiKohdeKayttajaRooli'::TEXT]
            )
        )
    );

INSERT INTO
    app.project_object_user_role (
        SELECT
            rakennuttaja_user,
            project_object_id,
            ('InvestointiKohdeKayttajaRooli', '01') :: app.code_id
        FROM
            app.project_object_investment
        WHERE
            rakennuttaja_user IS NOT null
    );

INSERT INTO
    app.project_object_user_role (
        SELECT
            suunnitteluttaja_user,
            project_object_id,
            ('InvestointiKohdeKayttajaRooli', '02') :: app.code_id
        FROM
            app.project_object_investment
        WHERE
            suunnitteluttaja_user IS NOT null
    );

ALTER TABLE
    app.project_object_investment DROP COLUMN rakennuttaja_user,
    DROP COLUMN suunnitteluttaja_user;