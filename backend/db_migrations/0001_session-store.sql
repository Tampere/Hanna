CREATE TABLE "session" (
  "sid" text NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp NOT NULL
);

ALTER TABLE "session" ADD CONSTRAINT session_pkey PRIMARY KEY ("sid");

CREATE INDEX idx_session_expire ON session("expire");
