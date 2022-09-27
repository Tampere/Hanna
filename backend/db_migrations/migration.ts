import { migrate } from 'postgres-migrations';

import { env } from '../src/env';
import { logger } from '../src/logging';

async function runMigrations() {
  const dbConfig = {
    database: env.pgDatabase,
    user: env.pgUser,
    password: env.pgPass,
    host: env.pgHost,
    port: env.pgPort,
  };
  await migrate(dbConfig, './db_migrations', {
    logger: (msg: string) => logger.info(msg),
  });
}

runMigrations();
