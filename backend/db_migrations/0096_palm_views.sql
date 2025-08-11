CREATE
OR REPLACE VIEW palm_project AS
SELECT
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
    (pc.committee_type).id AS "committee_id",
    (
        SELECT
            "text_fi"
        FROM
            app.code
        WHERE
            id = pc.committee_type
    ) AS "committee_text_fi",
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
    LEFT JOIN app.project_committee pc ON pc.project_id = p.id
WHERE
    p.deleted = FALSE;

CREATE
OR REPLACE VIEW palm_project_object AS
SELECT
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
    'investointi' AS "project_type",
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
WHERE
    po.deleted = FALSE;

CREATE
OR REPLACE VIEW palm_sap_actuals AS
SELECT
    po.id AS "project_object_id",
    sai.fiscal_year,
    SUM(sai.value_in_currency_subunit / 100) AS "sap_amount"
FROM
    app.project_object po
    INNER JOIN app.project_object_investment poi ON poi.project_object_id = po.id
    LEFT JOIN app.sap_actuals_item sai ON po.sap_wbs_id = sai.wbs_element_id
WHERE
    po.sap_wbs_id IS NOT NULL
    AND sai.fiscal_year IS NOT NULL
GROUP BY
    po.id,
    fiscal_year
ORDER BY
    po.id,
    sai.fiscal_year;

CREATE
OR REPLACE VIEW palm_budget AS
SELECT
    poi.project_object_id,
    b.YEAR,
    b.amount / 100 AS "amount",
    b.forecast / 100 AS "forecast",
    b.kayttosuunnitelman_muutos / 100 AS "kayttosuunnitelman_muutos"
FROM
    app.project_object_investment poi
    LEFT JOIN app.budget b ON b.project_object_id = poi.project_object_id
WHERE
    b.amount IS NOT NULL
    OR b.forecast IS NOT NULL
    OR b.kayttosuunnitelman_muutos IS NOT NULL
ORDER BY
    poi.project_object_id,
    b.year;