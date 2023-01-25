CREATE TABLE sap_actuals_raw (
  sap_project_id TEXT NOT NULL,
  actuals_year INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  data_hash TEXT NOT NULL,
  last_check TIMESTAMP DEFAULT now(),
  PRIMARY KEY (sap_project_id, actuals_year, data_hash)
);

CREATE INDEX idx_sap_actuals_raw_sap_project_id ON sap_actuals_raw (sap_project_id);

CREATE TABLE sap_actuals_item (
  document_number VARCHAR(10) PRIMARY KEY,
  description VARCHAR(60) NOT NULL,
  sap_project_id VARCHAR(24) NOT NULL,
  wbs_element_id VARCHAR(24),
  network_id VARCHAR(12),
  activity_id VARCHAR(4),
  fiscal_year INTEGER NOT NULL,
  document_date DATE NOT NULL,
  posting_date DATE NOT NULL,
  creation_date DATE NOT NULL,
  object_type VARCHAR(4) NOT NULL,
  currency VARCHAR(5) NOT NULL,
  value_in_currency_subunit INTEGER NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT'))
);

CREATE INDEX idx_sap_actuals_item_sap_project_id ON sap_actuals_item (sap_project_id);
