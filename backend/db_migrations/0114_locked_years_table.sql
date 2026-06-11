CREATE TABLE app.locked_years (
    year INTEGER PRIMARY KEY CHECK (year >= 2000 AND year <= 2100),
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opened_at TIMESTAMPTZ
);

-- Migrate existing locked years from global_settings
INSERT INTO app.locked_years (year, locked_by, locked_at)
SELECT (jsonb_array_elements_text(value))::int, 'migration', NOW()
FROM app.global_settings
WHERE setting = 'locked_years'
  AND value != '[]'::jsonb;

-- Remove the migrated row
DELETE FROM app.global_settings WHERE setting = 'locked_years';
