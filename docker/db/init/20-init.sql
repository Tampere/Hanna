CREATE SCHEMA app;
ALTER SCHEMA app OWNER TO app_user_dev;
CREATE EXTENSION pgcrypto;
ALTER SYSTEM SET log_statement TO 'mod';
