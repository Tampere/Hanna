ALTER TABLE sap_network ALTER COLUMN network_name DROP NOT NULL;
ALTER TABLE sap_activity ALTER COLUMN profit_center DROP NOT NULL;
ALTER TABLE sap_project ALTER COLUMN short_description DROP NOT NULL;
ALTER TABLE sap_wbs ALTER COLUMN short_description DROP NOT NULL;
