CREATE INDEX idx_project_daterange ON project USING gist(daterange(start_date, end_date));
