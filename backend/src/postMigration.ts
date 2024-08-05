import { createDatabasePool, getPool, sql } from './db';
import { logger } from './logging';

async function runPostMigration() {
  await createDatabasePool();
  try {
    await getPool().any(sql.untyped`
        CREATE ROLE geoserver;
        GRANT CONNECT ON DATABASE app_dev_db TO geoserver;
        GRANT USAGE ON SCHEMA app TO geoserver;
        GRANT SELECT ON TABLE app.geoserver_street_objects TO geoserver;
        CREATE user geoserver_user WITH PASSWORD 'geo_password';
        GRANT geoserver to geoserver_user;
    `);

    logger.info('Geoserver user added to database');
  } catch (error) {
    let errorMessage = 'Error while adding geoserver user';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    logger.warn(errorMessage);
  }
}

runPostMigration();
