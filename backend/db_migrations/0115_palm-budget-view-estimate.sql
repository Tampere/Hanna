DROP VIEW app.palm_budget;
-- Regexp used here because postgres 12 (used locally) doesnt support trim_scale()
CREATE VIEW app.palm_budget AS
SELECT
    poi.project_object_id,
    b.year,
    regexp_replace((round(b.estimate / 100 :: numeric, 2)) :: text, '\.?0+$', '') :: numeric AS estimate,
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
