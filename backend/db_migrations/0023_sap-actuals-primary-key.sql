ALTER TABLE sap_actuals_item DROP CONSTRAINT sap_actuals_item_pkey;
ALTER TABLE sap_actuals_item ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
