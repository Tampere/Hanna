import { migrate } from 'postgres-migrations';

import { SharedPool, createDatabasePool } from './db.js';
import { logger } from './logging.js';

async function runMigrations() {
  await createDatabasePool();
  await migrate({ client: SharedPool.getPool() }, './db_migrations', {
    logger: (msg: string) => logger.info(msg),
  });
}

runMigrations();
