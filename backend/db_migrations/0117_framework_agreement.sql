CREATE TABLE app.framework_agreement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_number TEXT NOT NULL,
    name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    valid_until DATE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modified_by TEXT REFERENCES app.user(id),
    modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app.project_object_investment
ADD COLUMN framework_agreement_id UUID REFERENCES app.framework_agreement(id);
