-- Migration to change company table primary key from business_id to UUID
-- Adds new Partial unqique index where business_id is unique only for non-deleted rows
-- This migration preserves all existing data.
BEGIN;

ALTER TABLE company
ADD COLUMN id UUID DEFAULT gen_random_uuid();

UPDATE company
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE company
ALTER COLUMN id SET NOT NULL;

ALTER TABLE company_contact
ADD COLUMN company_id UUID;

UPDATE company_contact
SET company_id = c.id
FROM company c
WHERE company_contact.business_id = c.business_id;

ALTER TABLE company_contact
ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE company_contact
DROP CONSTRAINT contractor_business_id_fkey;

ALTER TABLE company
DROP CONSTRAINT contractor_company_pkey;

ALTER TABLE company
ADD CONSTRAINT company_pkey PRIMARY KEY (id);

ALTER TABLE company_contact
ADD CONSTRAINT company_contact_company_id_fkey
FOREIGN KEY (company_id) REFERENCES company(id)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE company_contact
DROP COLUMN business_id;

CREATE UNIQUE INDEX idx_unique_business_id_active
ON app.company (business_id)
WHERE deleted IS FALSE;

COMMIT;