import { migrate } from 'postgres-migrations';

import { env } from '../src/env';
import { logger } from '../src/logging';

async function runMigrations() {
  const dbConfig = {
    database: env.db.database,
    host: env.db.host,
    port: env.db.port,
    user: env.db.username,
    password: env.db.password,
  };
  await migrate(dbConfig, './db_migrations', {
    logger: (msg: string) => logger.info(msg),
  });
}

runMigrations();
