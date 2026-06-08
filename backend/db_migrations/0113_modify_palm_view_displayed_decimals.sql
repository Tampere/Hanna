DROP VIEW app.palm_budget;
-- Regexp used here because postgres 12 (used locally) doesnt support trim_scale()
CREATE VIEW app.palm_budget AS
SELECT
    poi.project_object_id,
    b.year,
    regexp_replace((round(b.amount / 100 :: numeric, 2)) :: text, '\.?0+$', '') :: numeric AS amount,
    regexp_replace((round(b.forecast / 100 :: numeric, 2)) :: text, '\.?0+$', '') :: numeric AS forecast,
    regexp_replace((round(b.kayttosuunnitelman_muutos / 100 :: numeric, 2)) :: text, '\.?0+$', '') :: numeric AS kayttosuunnitelman_muutos
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

DROP VIEW app.palm_sap_actuals;

CREATE VIEW app.palm_sap_actuals AS
SELECT
    po.id AS project_object_id,
    sai.fiscal_year,
    regexp_replace((round(sum(sai.value_in_currency_subunit / 100) :: numeric, 2)) :: text, '\.?0+$', '') :: numeric AS sap_amount
FROM
    app.project_object po
    JOIN app.project_object_investment poi ON poi.project_object_id = po.id
    LEFT JOIN app.sap_actuals_item sai ON po.sap_wbs_id = sai.wbs_element_id :: text
WHERE
    po.sap_wbs_id IS NOT NULL
    AND sai.fiscal_year IS NOT NULL
GROUP BY
    po.id,
    sai.fiscal_year
ORDER BY
    po.id,
    sai.fiscal_year;
