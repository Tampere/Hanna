ALTER TABLE sap_wbs
ALTER COLUMN reason_for_environmental_investment DROP NOT NULL,
ALTER COLUMN requesting_cost_center DROP NOT NULL,
ALTER COLUMN responsible_cost_center DROP NOT NULL;
