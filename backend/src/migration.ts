import { migrate } from 'postgres-migrations';

import { createDatabasePool, createPgPool } from './db.js';
import { logger } from './logging.js';

async function runMigrations() {
  await createDatabasePool();
  await migrate({ client: createPgPool() }, './db_migrations', {
    logger: (msg: string) => logger.info(msg),
  });
}

runMigrations();
