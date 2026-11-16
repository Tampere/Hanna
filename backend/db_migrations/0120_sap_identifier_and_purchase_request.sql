-- Requests sent to the finance department to create a SAP project (hanke) or WBS element (kohde).
CREATE TABLE app.sap_identifier_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES app.project (id),
  -- NULL for a hanke request
  project_object_id UUID REFERENCES app.project_object (id),
  -- Request-only fields (hankeluokka, palveluluokat, kustannuspaikka) that have no column elsewhere
  request_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  requested_by TEXT NOT NULL REFERENCES app.user (id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by TEXT REFERENCES app.user (id),
  completed_at TIMESTAMPTZ
);

-- Only one open request per hanke and per kohde
CREATE UNIQUE INDEX sap_identifier_request_open_project_idx
  ON app.sap_identifier_request (project_id)
  WHERE project_object_id IS NULL AND completed_at IS NULL;

CREATE UNIQUE INDEX sap_identifier_request_open_project_object_idx
  ON app.sap_identifier_request (project_object_id)
  WHERE project_object_id IS NOT NULL AND completed_at IS NULL;

-- Purchase requests (ostotilauspyyntö) for project objects that have a SAP WBS.
-- Resending replaces the row; history is kept in the audit log.
CREATE TABLE app.purchase_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_object_id UUID NOT NULL REFERENCES app.project_object (id),
  responsible_person TEXT NOT NULL REFERENCES app.user (id),
  orderer TEXT NOT NULL REFERENCES app.user (id),
  company_id UUID NOT NULL REFERENCES app.company (id),
  company_contact_id UUID REFERENCES app.company_contact (id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cost_center_id TEXT NOT NULL REFERENCES app.cost_center (id),
  framework_agreement_id UUID REFERENCES app.framework_agreement (id),
  vat_rate app.code_id NOT NULL CHECK ((vat_rate).code_list_id = 'AlvKanta') REFERENCES app.code (id),
  is_contract_price BOOLEAN NOT NULL DEFAULT FALSE,
  -- In cents, like budget amounts. Required when is_contract_price.
  contract_price BIGINT CHECK (NOT is_contract_price OR contract_price IS NOT NULL),
  -- [{ "phaseCode": "3210", "amount": 123400 }], amounts in cents
  phase_prices JSONB NOT NULL DEFAULT '[]'::jsonb,
  purchase_order_number TEXT,
  purchase_order_number_set_by TEXT REFERENCES app.user (id),
  purchase_order_number_set_at TIMESTAMPTZ,
  created_by TEXT NOT NULL REFERENCES app.user (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL REFERENCES app.user (id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (end_date >= start_date)
);

CREATE INDEX purchase_request_project_object_idx
  ON app.purchase_request (project_object_id)
  WHERE NOT deleted;
