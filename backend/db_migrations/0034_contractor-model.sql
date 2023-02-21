CREATE TABLE "contractor_company" (
  business_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  modified_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE "contractor" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email_address TEXT NOT NULL,
  business_id TEXT REFERENCES contractor_company(business_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  modified_by TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE "history_entry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  row_data JSONB NOT NULL,
  modified_by TEXT NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION history_entry_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_row_json JSONB;
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    old_row_json = row_to_json(OLD);
    INSERT INTO app.history_entry (table_name, row_data, modified_by, modified_at)
    VALUES (TG_TABLE_NAME, old_row_json, OLD.modified_by, OLD.modified_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contractor_company_history_entry_trigger
AFTER UPDATE ON contractor_company
FOR EACH ROW
EXECUTE PROCEDURE history_entry_trigger();

CREATE TRIGGER contractor_history_entry_trigger
AFTER UPDATE ON contractor
FOR EACH ROW
EXECUTE PROCEDURE history_entry_trigger();

ALTER TABLE task
ADD COLUMN contractor_id UUID REFERENCES contractor(id)
ON DELETE RESTRICT ON UPDATE CASCADE;
