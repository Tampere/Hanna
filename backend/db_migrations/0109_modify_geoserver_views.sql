DROP VIEW app.geoserver_construction_objects;

DROP VIEW app.geoserver_street_objects;

CREATE VIEW app.geoserver_construction_objects AS WITH object_types AS (
    SELECT
        po.id,
        string_agg(category_text.text_fi, '; ' :: text) AS object_type
    FROM
        app.project_object po
        LEFT JOIN app.project_object_type pot ON po.id = pot.project_object_id
        LEFT JOIN app.code category_text ON category_text.id = pot.object_type
    GROUP BY
        po.id
),
object_categories AS (
    SELECT
        po.id,
        string_agg(category_text.text_fi, '; ' :: text) AS object_category
    FROM
        app.project_object po
        LEFT JOIN app.project_object_category poc ON po.id = poc.project_object_id
        LEFT JOIN app.code category_text ON category_text.id = poc.object_category
    GROUP BY
        po.id
),
object_usages AS (
    SELECT
        po.id,
        string_agg(usage_text.text_fi, '; ' :: text) AS object_usage
    FROM
        app.project_object po
        LEFT JOIN app.project_object_usage pou ON po.id = pou.project_object_id
        LEFT JOIN app.code usage_text ON usage_text.id = pou.object_usage
    GROUP BY
        po.id
),
project_objects AS (
    SELECT
        po.id,
        po.sap_wbs_id,
        po.object_name,
        po.description,
        po.public_description,
        p.project_name,
        po.start_date,
        po.end_date,
        lifecycle_text.text_fi AS object_lifecycle_state,
        oc.object_category,
        ou.object_usage,
        ot.object_type,
        po.geom AS object_geometry
    FROM
        app.project_object po
        LEFT JOIN app.project_object_investment poi ON po.id = poi.project_object_id
        LEFT JOIN app.project p ON po.project_id = p.id
        LEFT JOIN app.code lifecycle_text ON lifecycle_text.id = po.lifecycle_state
        LEFT JOIN object_categories oc ON oc.id = po.id
        LEFT JOIN object_usages ou ON ou.id = po.id
        LEFT JOIN object_types ot ON ot.id = po.id
    WHERE
        (
            (poi.object_stage).id = '02' :: text
            OR (poi.object_stage).id = '01'
        )
        AND po.deleted = false
        AND po.start_date BETWEEN '2026-01-01'
        AND '2029-12-31'
),
yearly_budgets AS (
    SELECT
        b.amount,
        b.forecast,
        b.year AS budget_year,
        b.project_object_id
    FROM
        app.budget b,
        project_objects
    WHERE
        b.project_object_id = project_objects.id
),
yearly_totals AS (
    SELECT
        sap_actuals_item.fiscal_year,
        sum(sap_actuals_item.value_in_currency_subunit) AS total,
        sap_actuals_item.wbs_element_id
    FROM
        app.sap_actuals_item,
        project_objects
    WHERE
        sap_actuals_item.wbs_element_id :: text = project_objects.sap_wbs_id
        AND sap_actuals_item.fiscal_year >= 2026
        AND sap_actuals_item.fiscal_year <= 2029
    GROUP BY
        sap_actuals_item.fiscal_year,
        sap_actuals_item.wbs_element_id
),
internal_roles AS (
    SELECT
        pour.project_object_id,
        MAX(u.name) FILTER (
            WHERE
                (pour.role).id = '01'
        ) AS rakennuttaja,
        MAX(u.name) FILTER (
            WHERE
                (pour.role).id = '02'
        ) AS suunnitteluttaja
    FROM
        app.project_object_user_role pour
        LEFT JOIN app."user" u ON pour.user_id = u.id
    WHERE
        (pour.role).code_list_id = 'InvestointiKohdeKayttajaRooli'
        AND (pour.role).id IN ('01', '02')
    GROUP BY
        pour.project_object_id
)
SELECT
    pos.id,
    pos.sap_wbs_id,
    pos.object_name,
    pos.description AS internal_description,
    pos.public_description,
    pos.project_name,
    pos.start_date,
    pos.end_date,
    pos.object_lifecycle_state,
    pos.object_category,
    pos.object_usage,
    pos.object_type,
    pos.object_geometry,
    ir.rakennuttaja,
    ir.suunnitteluttaja,
    budgets_2026.amount / 100 AS amount_2026,
    totals_2026.total / 100 :: numeric AS total_2026,
    budgets_2026.forecast / 100 AS forecast_2026,
    budgets_2027.amount / 100 AS amount_2027,
    totals_2027.total / 100 :: numeric AS total_2027,
    budgets_2027.forecast / 100 AS forecast_2027,
    budgets_2028.amount / 100 AS amount_2028,
    totals_2028.total / 100 :: numeric AS total_2028,
    budgets_2028.forecast / 100 AS forecast_2028,
    budgets_2029.amount / 100 AS amount_2029,
    totals_2029.total / 100 :: numeric AS total_2029,
    budgets_2029.forecast / 100 AS forecast_2029
FROM
    project_objects pos
    LEFT JOIN internal_roles ir ON ir.project_object_id = pos.id
    LEFT JOIN (
        SELECT
            yearly_totals.fiscal_year,
            yearly_totals.total,
            yearly_totals.wbs_element_id
        FROM
            yearly_totals
        WHERE
            yearly_totals.fiscal_year = 2026
    ) totals_2026 ON totals_2026.wbs_element_id :: text = pos.sap_wbs_id
    LEFT JOIN (
        SELECT
            yearly_budgets.amount,
            yearly_budgets.forecast,
            yearly_budgets.budget_year,
            yearly_budgets.project_object_id
        FROM
            yearly_budgets
        WHERE
            yearly_budgets.budget_year = 2026
    ) budgets_2026 ON budgets_2026.project_object_id = pos.id
    LEFT JOIN (
        SELECT
            yearly_totals.fiscal_year,
            yearly_totals.total,
            yearly_totals.wbs_element_id
        FROM
            yearly_totals
        WHERE
            yearly_totals.fiscal_year = 2027
    ) totals_2027 ON totals_2027.wbs_element_id :: text = pos.sap_wbs_id
    LEFT JOIN (
        SELECT
            yearly_budgets.amount,
            yearly_budgets.forecast,
            yearly_budgets.budget_year,
            yearly_budgets.project_object_id
        FROM
            yearly_budgets
        WHERE
            yearly_budgets.budget_year = 2027
    ) budgets_2027 ON budgets_2027.project_object_id = pos.id
    LEFT JOIN (
        SELECT
            yearly_totals.fiscal_year,
            yearly_totals.total,
            yearly_totals.wbs_element_id
        FROM
            yearly_totals
        WHERE
            yearly_totals.fiscal_year = 2028
    ) totals_2028 ON totals_2028.wbs_element_id :: text = pos.sap_wbs_id
    LEFT JOIN (
        SELECT
            yearly_budgets.amount,
            yearly_budgets.forecast,
            yearly_budgets.budget_year,
            yearly_budgets.project_object_id
        FROM
            yearly_budgets
        WHERE
            yearly_budgets.budget_year = 2028
    ) budgets_2028 ON budgets_2028.project_object_id = pos.id
    LEFT JOIN (
        SELECT
            yearly_totals.fiscal_year,
            yearly_totals.total,
            yearly_totals.wbs_element_id
        FROM
            yearly_totals
        WHERE
            yearly_totals.fiscal_year = 2029
    ) totals_2029 ON totals_2029.wbs_element_id :: text = pos.sap_wbs_id
    LEFT JOIN (
        SELECT
            yearly_budgets.amount,
            yearly_budgets.forecast,
            yearly_budgets.budget_year,
            yearly_budgets.project_object_id
        FROM
            yearly_budgets
        WHERE
            yearly_budgets.budget_year = 2029
    ) budgets_2029 ON budgets_2029.project_object_id = pos.id;