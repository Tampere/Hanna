ALTER TABLE project_object ADD COLUMN geohash text GENERATED ALWAYS AS (
  ST_GEOHASH(
    ST_TRANSFORM(
      ST_CENTROID(geom),
      4326
    )
  )
) STORED;