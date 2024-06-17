CREATE TABLE app.general_notification (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title TEXT NOT NULL,
	message JSONB,
    message_version TEXT NOT NULL DEFAULT '1', --initial message format version
	created_at TIMESTAMP DEFAULT now(),
	publisher TEXT REFERENCES app.user(id)
);
