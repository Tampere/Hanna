DROP VIEW app.palm_project;

CREATE VIEW app.palm_project AS
SELECT
    p.id,
    p.project_name,
    (pi.palm_grouping).id AS "palm_grouping_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = pi.palm_grouping
    ) AS "palm_grouping_text_fi",
    (pi.target).id AS "target_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = pi.target
    ) AS "target_text_fi",
    (p.lifecycle_state).id AS "lifecycle_state_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = p.lifecycle_state
    ) AS "lifecycle_state_text_fi",
    'investointi' AS "type"
FROM
    app.project p
    INNER JOIN app.project_investment pi ON p.id = pi.id
WHERE
    p.deleted = FALSE;

DROP VIEW app.palm_project_object;

CREATE VIEW app.palm_project_object AS
SELECT
    po.id,
    po.project_id,
    po.object_name,
    (poi.palm_grouping).id AS "palm_grouping_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = poi.palm_grouping
    ) AS "palm_grouping_text_fi",
    (poc.committee_type).id AS "committee_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = poc.committee_type
    ) AS "committee_text_fi",
    (po.lifecycle_state).id AS "lifecycle_state_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = po.lifecycle_state
    ) AS "lifecycle_state_text_fi",
    (pot.object_type).id AS object_type_id,
    (
        SELECT
            code.text_fi
        FROM
            app.code
        WHERE
            code.id = pot.object_type
    ) AS object_type_text_fi,
    (poca.object_category).id AS "object_category",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = poca.object_category
    ) AS "object_category_text_fi",
    (pou.object_usage).id AS "object_usage_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = pou.object_usage
    ) AS "object_usage_text_fi"
FROM
    app.project_object po
    INNER JOIN app.project_object_investment poi ON po.id = poi.project_object_id
    LEFT JOIN app.project_object_committee poc ON poc.project_object_id = po.id
    LEFT JOIN app.project_object_category poca ON poca.project_object_id = po.id
    LEFT JOIN app.project_object_usage pou ON pou.project_object_id = po.id
    LEFT JOIN app.project_object_type pot ON pot.project_object_id = po.id
WHERE
    po.deleted = FALSE;