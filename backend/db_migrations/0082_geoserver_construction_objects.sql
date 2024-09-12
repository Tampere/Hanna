CREATE VIEW app.geoserver_construction_objects AS (
    WITH object_types AS (
        SELECT
            po.id,
            string_agg(category_text.text_fi, '; ') AS object_type
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
            string_agg(category_text.text_fi, '; ') AS object_category
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
            string_agg(usage_text.text_fi, '; ') AS object_usage
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
            p.project_name,
            EXTRACT(
                'year'
                FROM
                    po.start_date
            ) :: int AS start_year,
            EXTRACT(
                'year'
                FROM
                    po.end_date
            ) :: int AS end_year,
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
            (poi.object_stage).id = '02'
            AND po.deleted = FALSE
    ),
    yearly_budgets AS (
        SELECT
            b.amount,
            b.forecast,
            b.YEAR AS budget_year,
            b.project_object_id
        FROM
            app.budget b,
            project_objects
        WHERE
            b.project_object_id = project_objects.id
    ),
    yearly_totals AS (
        SELECT
            fiscal_year,
            sum(value_in_currency_subunit) AS total,
            wbs_element_id
        FROM
            app.sap_actuals_item,
            project_objects
        WHERE
            wbs_element_id = project_objects.sap_wbs_id
            AND fiscal_year >= 2024
            AND fiscal_year <= 2027
        GROUP BY
            fiscal_year,
            wbs_element_id
    )
    SELECT
        pos.id,
        pos.sap_wbs_id,
        pos.object_name,
        pos.description,
        pos.project_name,
        pos.start_year,
        pos.end_year,
        pos.object_lifecycle_state,
        object_category,
        object_usage,
        object_type,
        pos.object_geometry,
        budgets_2024.amount / 100 AS amount_2024,
        --talousarvio
        totals_2024.total / 100 AS total_2024,
        --toteuma
        budgets_2024.forecast / 100 AS forecast_2024,
        --ennuste
        budgets_2025.amount / 100 AS amount_2025,
        totals_2025.total / 100 AS total_2025,
        budgets_2025.forecast / 100 AS forecast_2025,
        budgets_2026.amount / 100 AS amount_2026,
        totals_2026.total / 100 AS total_2026,
        budgets_2026.forecast / 100 AS forecast_2026,
        budgets_2027.amount / 100 AS amount_2027,
        totals_2027.total / 100 AS total_2027,
        budgets_2027.forecast / 100 AS forecast_2027
    FROM
        project_objects pos
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_totals
            WHERE
                fiscal_year = 2024
        ) totals_2024 ON totals_2024.wbs_element_id = pos.sap_wbs_id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_budgets
            WHERE
                budget_year = 2024
        ) budgets_2024 ON budgets_2024.project_object_id = pos.id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_totals
            WHERE
                fiscal_year = 2025
        ) totals_2025 ON totals_2025.wbs_element_id = pos.sap_wbs_id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_budgets
            WHERE
                budget_year = 2025
        ) budgets_2025 ON budgets_2025.project_object_id = pos.id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_totals
            WHERE
                fiscal_year = 2026
        ) totals_2026 ON totals_2026.wbs_element_id = pos.sap_wbs_id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_budgets
            WHERE
                budget_year = 2026
        ) budgets_2026 ON budgets_2026.project_object_id = pos.id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_totals
            WHERE
                fiscal_year = 2027
        ) totals_2027 ON totals_2027.wbs_element_id = pos.sap_wbs_id
        LEFT JOIN (
            SELECT
                *
            FROM
                yearly_budgets
            WHERE
                budget_year = 2027
        ) budgets_2027 ON budgets_2027.project_object_id = pos.id
);