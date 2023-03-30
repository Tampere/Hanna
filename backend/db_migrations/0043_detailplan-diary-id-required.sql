UPDATE project_detailplan SET diary_id = '' WHERE diary_id IS NULL;
ALTER TABLE project_detailplan
ALTER COLUMN diary_id SET NOT NULL;
