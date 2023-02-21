CREATE TABLE report_file (
  pgboss_job_id uuid NOT NULL PRIMARY KEY REFERENCES pgboss.job(id) ON DELETE CASCADE,
  report_filename text NOT NULL,
  report_data bytea NOT NULL
);
