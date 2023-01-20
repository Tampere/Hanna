CREATE TABLE sap_projectinfo_raw (
  sap_project_id TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  data_hash TEXT NOT NULL,
  last_check TIMESTAMP DEFAULT now(),
  PRIMARY KEY (sap_project_id, data_hash)
);

CREATE INDEX idx_sap_projectinfo_raw_sap_project_id ON sap_projectinfo_raw (sap_project_id);

CREATE TABLE sap_project (
  sap_project_id VARCHAR(24) PRIMARY KEY,  -- PSPID
  sap_project_internal_id VARCHAR(8) NOT NULL UNIQUE, -- PSPNR
  short_description VARCHAR(40) NOT NULL, -- POST1
  created_at DATE NOT NULL,  -- ERDAT
  created_by VARCHAR(12) NOT NULL,  -- ERNAM
  updated_at DATE,  -- AEDAT
  updated_by VARCHAR(12),  -- AENAM
  project_manager_name VARCHAR(25) NOT NULL, -- VERNA
  applicant_name VARCHAR(25) NOT NULL,  -- ASTNA
  planned_start_date DATE,  -- PLFAZ
  planned_finish_date DATE,  -- PLSEZ
  plant VARCHAR(4) NOT NULL -- WERKS
);

CREATE INDEX idx_sap_project_sap_project_id ON sap_project (sap_project_id);
CREATE INDEX idx_sap_project_sap_project_internal_id ON sap_project (sap_project_internal_id);

CREATE TABLE sap_wbs (
  wbs_id VARCHAR(24) PRIMARY KEY,  -- POSID
  wbs_internal_id VARCHAR(8) NOT NULL UNIQUE,  -- PSPNR
  -- PSPHI -> PSPNR
  sap_project_internal_id VARCHAR(24) REFERENCES sap_project(sap_project_internal_id) NOT NULL,
  short_description VARCHAR(40) NOT NULL,  -- POST1
  created_at DATE NOT NULL,  -- ERDAT
  created_by VARCHAR(12) NOT NULL,  -- ERNAM
  updated_at DATE,  -- AEDAT
  updated_by VARCHAR(12),  -- AENAM
  applicant_name VARCHAR(25) NOT NULL,  -- ASTNA
  requesting_cost_center VARCHAR(10) NOT NULL,  -- AKSTL
  responsible_cost_center VARCHAR(10) NOT NULL, -- FKSTL
  project_type VARCHAR(2) NOT NULL,  -- PRART
  priority VARCHAR(1) NOT NULL,  -- PSPRI
  plant VARCHAR(4) NOT NULL,  -- WERKS
  technically_completed_at DATE,  -- TADAT
  reason_for_investment VARCHAR(2) NOT NULL,  -- IZWEK
  reason_for_environmental_investment VARCHAR(5) NOT NULL, -- IUMKZ
  hierarchy_level INTEGER NOT NULL  -- STUFE
);

CREATE INDEX idx_sap_wbs_wbs_internal_id ON sap_wbs (wbs_internal_id);

CREATE TABLE sap_network (
  network_id VARCHAR(12) PRIMARY KEY, -- AUFNR
  network_name VARCHAR(40) NOT NULL, -- KTEXT
  wbs_internal_id VARCHAR(8) REFERENCES sap_wbs(wbs_internal_id) NOT NULL, -- PSPEL -> PSPNR
  -- PSPHI -> PSPNR
  sap_project_internal_id VARCHAR(24) REFERENCES sap_project(sap_project_internal_id) NOT NULL,
  created_at DATE NOT NULL, -- ERDAT
  created_by VARCHAR(12) NOT NULL, -- ERNAM
  actual_start_date DATE, -- GSTRI
  actual_finish_date DATE, -- GETRI
  company_code VARCHAR(4), -- BUKRS
  plant VARCHAR(4), -- WERKS
  technical_completion_date DATE, -- IDAT2
  profit_center VARCHAR(10) -- PRCTR
);

CREATE INDEX idx_sap_network_network_id ON sap_network (network_id);

CREATE TABLE sap_activity (
  routing_number VARCHAR(10) NOT NULL, -- AUFPL
  order_counter VARCHAR(8) NOT NULL, -- APLZL
  activity_number VARCHAR(4) NOT NULL, -- VORNR
  network_id VARCHAR(12) REFERENCES sap_network(network_id) NOT NULL, -- AUFNR
  short_description VARCHAR(40) NOT NULL, -- LTXA1
  -- PSPHI -> PSPNR
  sap_project_internal_id VARCHAR(8) REFERENCES sap_project(sap_project_internal_id) NOT NULL,
  wbs_internal_id VARCHAR(8) REFERENCES sap_wbs(wbs_internal_id) NOT NULL, -- PSPEL -> PSPNR
  profit_center VARCHAR(10) NOT NULL, -- PRCTR
  plant VARCHAR(4) NOT NULL, -- WERKS
  PRIMARY KEY (routing_number, order_counter) -- AUFPL + APLZL
);
