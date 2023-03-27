ALTER TABLE app.project_detailplan
ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
  setweight(
    to_tsvector(
      'simple',
      coalesce(detailplan_id::text, '')
    ),
    'A'
  )
) STORED;
CREATE INDEX ON app.project_detailplan USING gin(tsv);
