ALTER TABLE sap_wbs
ADD COLUMN consult_company TEXT,
ADD COLUMN blanket_order_id TEXT,
ADD COLUMN decision_maker TEXT,
ADD COLUMN decision_date_text TEXT,
ADD COLUMN contract_price_in_currency_subunit BIGINT;
