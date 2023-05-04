CREATE TABLE IF NOT EXISTS "mail_event" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz DEFAULT now(),
  sent_by text,
  template_name text,
  "to" text [] DEFAULT ARRAY[]::text [],
  cc text [] DEFAULT ARRAY[]::text [],
  bcc text [] DEFAULT ARRAY[]::text [],
  subject text,
  html text,
  project_id uuid REFERENCES project (id) ON DELETE SET NULL
)
