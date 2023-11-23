ALTER TABLE app.user ADD COLUMN role text;
ALTER TABLE app.user ADD COLUMN permissions text[] DEFAULT '{}'::text[];
