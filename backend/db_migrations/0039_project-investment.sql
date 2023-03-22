ALTER TABLE project_common RENAME TO project_investment;
ALTER TABLE project_investment DROP COLUMN project_type;

-- Add new columns as optional
ALTER TABLE project
ADD COLUMN start_date date,
ADD COLUMN end_date date,
ADD COLUMN lifecycle_state code_id;

-- Set default values
UPDATE project
SET start_date = current_date,
    end_date = current_date,
    lifecycle_state = ('HankkeenElinkaarentila', '01')::code_id;

-- Override with existing values if found
UPDATE project p
SET start_date = pi.start_date,
    end_date = pi.end_date,
    lifecycle_state = pi.lifecycle_state
FROM project_investment AS pi
WHERE p.id = pi.id;

-- Set the columns required
ALTER TABLE project
ALTER COLUMN start_date
SET NOT NULL,
ALTER COLUMN end_date
SET NOT NULL,
ALTER COLUMN lifecycle_state
SET NOT NULL;

-- Remove the old columns
ALTER TABLE project_investment DROP COLUMN start_date,
DROP COLUMN end_date,
DROP COLUMN lifecycle_state;

-- Remove old project type code list
DELETE FROM code WHERE (id) .code_list_id = 'HankeTyyppi';
