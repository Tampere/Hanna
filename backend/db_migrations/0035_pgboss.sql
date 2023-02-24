-- Auto-generated pg-boss tables (needed for foreign key references in other migrations)
CREATE SCHEMA pgboss;
CREATE TYPE pgboss."job_state" AS ENUM (
  'created',
  'retry',
  'active',
  'completed',
  'expired',
  'cancelled',
  'failed'
);
CREATE TABLE pgboss.job (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  priority int4 NOT NULL DEFAULT 0,
  "data" jsonb NULL,
  state pgboss."job_state" NOT NULL DEFAULT 'created'::pgboss.job_state,
  retrylimit int4 NOT NULL DEFAULT 0,
  retrycount int4 NOT NULL DEFAULT 0,
  retrydelay int4 NOT NULL DEFAULT 0,
  retrybackoff bool NOT NULL DEFAULT false,
  startafter timestamptz NOT NULL DEFAULT now(),
  startedon timestamptz NULL,
  singletonkey text NULL,
  singletonon timestamp NULL,
  expirein interval NOT NULL DEFAULT '00:15:00'::interval,
  createdon timestamptz NOT NULL DEFAULT now(),
  completedon timestamptz NULL,
  keepuntil timestamptz NOT NULL DEFAULT now() + '14 days'::interval,
  on_complete bool NOT NULL DEFAULT false,
  "output" jsonb NULL,
  CONSTRAINT job_pkey PRIMARY KEY (id)
);
CREATE INDEX job_fetch ON pgboss.job USING btree (name text_pattern_ops, startafter)
WHERE (state < 'active'::pgboss.job_state);
CREATE INDEX job_name ON pgboss.job USING btree (name text_pattern_ops);
CREATE UNIQUE INDEX job_singleton_queue ON pgboss.job USING btree (name, singletonkey)
WHERE (
    (state < 'active'::pgboss.job_state)
    AND (singletonon IS NULL)
    AND (
      singletonkey ~~ '\_\_pgboss\_\_singleton\_queue%'::text
    )
  );
CREATE UNIQUE INDEX job_singletonkey ON pgboss.job USING btree (name, singletonkey)
WHERE (
    (state < 'completed'::pgboss.job_state)
    AND (singletonon IS NULL)
    AND (
      NOT (
        singletonkey ~~ '\_\_pgboss\_\_singleton\_queue%'::text
      )
    )
  );
CREATE UNIQUE INDEX job_singletonkeyon ON pgboss.job USING btree (name, singletonon, singletonkey)
WHERE (state < 'expired'::pgboss.job_state);
CREATE UNIQUE INDEX job_singletonon ON pgboss.job USING btree (name, singletonon)
WHERE (
    (state < 'expired'::pgboss.job_state)
    AND (singletonkey IS NULL)
  );
CREATE TABLE pgboss.archive (
  id uuid NOT NULL,
  "name" text NOT NULL,
  priority int4 NOT NULL,
  "data" jsonb NULL,
  state pgboss."job_state" NOT NULL,
  retrylimit int4 NOT NULL,
  retrycount int4 NOT NULL,
  retrydelay int4 NOT NULL,
  retrybackoff bool NOT NULL,
  startafter timestamptz NOT NULL,
  startedon timestamptz NULL,
  singletonkey text NULL,
  singletonon timestamp NULL,
  expirein interval NOT NULL,
  createdon timestamptz NOT NULL,
  completedon timestamptz NULL,
  keepuntil timestamptz NOT NULL,
  on_complete bool NOT NULL,
  "output" jsonb NULL,
  archivedon timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX archive_archivedon_idx ON pgboss.archive USING btree (archivedon);
CREATE INDEX archive_id_idx ON pgboss.archive USING btree (id);
CREATE TABLE pgboss.schedule (
  "name" text NOT NULL,
  cron text NOT NULL,
  timezone text NULL,
  "data" jsonb NULL,
  "options" jsonb NULL,
  created_on timestamptz NOT NULL DEFAULT now(),
  updated_on timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_pkey PRIMARY KEY (name)
);
CREATE TABLE pgboss."subscription" (
  "event" text NOT NULL,
  "name" text NOT NULL,
  created_on timestamptz NOT NULL DEFAULT now(),
  updated_on timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_pkey PRIMARY KEY (event, name)
);
CREATE TABLE pgboss."version" (
  "version" int4 NOT NULL,
  maintained_on timestamptz NULL,
  cron_on timestamptz NULL,
  CONSTRAINT version_pkey PRIMARY KEY (version)
);
-- Manually set the current version - pgboss will apply its migrations if needed
insert into pgboss."version" ("version", maintained_on, cron_on)
values (20, '2023-02-24 12:00:00', '2023-02-24 12:00:00');
