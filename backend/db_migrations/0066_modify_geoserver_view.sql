DROP VIEW app.geoserver_street_objects;
CREATE VIEW app.geoserver_street_objects AS (
	SELECT
        po.id,
        po.object_name,
        po.description,
        p.project_name,
        EXTRACT('year' FROM po.start_date)::int AS start_year,
        EXTRACT('year' FROM po.end_date)::int AS end_year,
        lifecycle_text.text_fi AS object_lifecycle_state,
        category_text.text_fi AS object_category,
        usage_text.text_fi AS object_usage,
        po.geom AS object_geometry
    FROM app.project p
        LEFT JOIN app.project_object po ON p.id = po.project_id
        LEFT JOIN app.project_object_category poc ON po.id = poc.project_object_id
        LEFT JOIN app.project_object_usage pou ON po.id = pou.project_object_id
        LEFT JOIN app.code lifecycle_text ON lifecycle_text.id = po.lifecycle_state
        LEFT JOIN app.code category_text ON category_text.id = poc.object_category
        LEFT JOIN app.code usage_text ON usage_text.id = pou.object_usage
    WHERE (poc.object_category).id = '07');