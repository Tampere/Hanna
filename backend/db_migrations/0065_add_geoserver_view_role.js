// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const create_geoserver_role = `
    CREATE ROLE geoserver;

    DO $$
        DECLARE
            current_database TEXT := current_database();
        BEGIN
            EXECUTE FORMAT('GRANT CONNECT ON DATABASE %I TO geoserver', current_database);
        END
    $$;

    GRANT USAGE ON SCHEMA app TO geoserver;
    GRANT SELECT ON TABLE app.geoserver_street_objects TO geoserver;`;

const create_geoserver_user = `
    CREATE user geoserver_user WITH PASSWORD '${process.env.DB_GEOSERVER_USER_PASSWORD}';
    GRANT geoserver to geoserver_user;`;

module.exports.generateSql = () => `${create_geoserver_role} ${create_geoserver_user}`;
