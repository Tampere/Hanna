CREATE TABLE app.global_settings (
    setting TEXT PRIMARY KEY,
    value jsonb NOT NULL,
);

INSERT INTO app.global_settings (setting, value) VALUES
    ('locked_years', '[]'::jsonb)
