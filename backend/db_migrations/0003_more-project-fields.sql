ALTER TABLE app.project
ADD COLUMN start_date DATE NOT NULL,
ADD COLUMN end_date DATE NOT NULL CHECK (start_date < end_date);
