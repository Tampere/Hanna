CREATE TABLE app.project_object_committee (
    project_object_id uuid NOT NULL REFERENCES app.project_object(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
    committee_type app.code_id NOT NULL CHECK (
        (committee_type).code_list_id = 'Lautakunta'
    ) REFERENCES app.code(id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id, committee_type) REFERENCES app.project_committee(project_id, committee_type),
    PRIMARY KEY (project_object_id, project_id, committee_type)
);

-- Add committees to project objects
WITH committees AS (
    SELECT
        project_id,
        ROW_NUMBER() OVER (
            PARTITION BY pc.project_id
            ORDER BY
                (pc.committee_type).id
        ) AS row,
        committee_type
    FROM
        app.project_committee pc
),
single_committees AS (
    SELECT
        *
    FROM
        committees
    WHERE
        row = 1
),
investment_objects AS (
    SELECT
        *
    FROM
        app.project_object_investment poi
        INNER JOIN app.project_object po ON po.id = poi.project_object_id
),
investment_committees AS (
    SELECT
        single_committees.project_id,
        investment_objects.project_object_id,
        single_committees.committee_type
    FROM
        single_committees
        INNER JOIN investment_objects ON investment_objects.project_id = single_committees.project_id
)
INSERT INTO
    app.project_object_committee
SELECT
    project_object_id,
    project_id,
    committee_type
FROM
    investment_committees;

-- Add committee to budget table
ALTER TABLE
    app.budget
ADD
    COLUMN committee app.code_id CHECK (
        committee IS NULL
        OR (committee).code_list_id = 'Lautakunta'
    );

-- Update investment project budget with committees
WITH committees AS (
    SELECT
        project_id,
        ROW_NUMBER() OVER (
            PARTITION BY pc.project_id
            ORDER BY
                (pc.committee_type).id
        ) AS row,
        committee_type
    FROM
        app.project_committee pc
        INNER JOIN app.project_investment pi ON pc.project_id = pi.id
),
single_committees AS (
    SELECT
        *
    FROM
        committees
    WHERE
        row = 1
)
UPDATE
    app.budget b
SET
    committee = sc.committee_type
FROM
    single_committees sc
WHERE
    b.project_id = sc.project_id;

-- Update investment project object budget with committees
WITH committees AS (
    SELECT
        poc.project_object_id,
        ROW_NUMBER() OVER (
            PARTITION BY poc.project_object_id
            ORDER BY
                (poc.committee_type).id
        ) AS row,
        committee_type
    FROM
        app.project_object_committee poc
        INNER JOIN app.project_object_investment pi ON poc.project_object_id = pi.project_object_id
),
single_committees AS (
    SELECT
        *
    FROM
        committees
    WHERE
        row = 1
)
UPDATE
    app.budget b
SET
    committee = sc.committee_type
FROM
    single_committees sc
WHERE
    b.project_object_id = sc.project_object_id;