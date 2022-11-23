ALTER TABLE app.project
ADD COLUMN tsv tsvector GENERATED ALWAYS AS (
    setweight(
      to_tsvector(
        'simple',
        coalesce(project_name, '')
      ),
      'A'
    ) || setweight(
      to_tsvector(
        'simple',
        coalesce(description, '')
      ),
      'B'
    )
  ) STORED;
CREATE INDEX ON app.project USING GIN(tsv);
