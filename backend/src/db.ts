import { Pool, PoolConfig } from 'pg';
import {
  DatabasePool,
  createPool,
  createTypeParserPreset,
  sql as slonikSql,
  stringifyDsn,
} from 'slonik';

import { env } from '@backend/env';
import { logger } from '@backend/logging';

// * fastify session plugin requires a 'pg' connection pool
// * slonik pool can be created with custom class.
// In order to use one and only one connection pool we need access the
// underlying pg pool instance that can be passed to fastify session plugin.
export class SharedPool extends Pool {
  private static pool: Pool;
  constructor(config: PoolConfig) {
    super(config);
    SharedPool.pool = this;
  }
  static getPool() {
    return SharedPool.pool;
  }
}

export const connectionDsn =
  stringifyDsn({
    databaseName: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
  }) + `?sslmode=${env.db.sslMode}`;

let pool: DatabasePool | null = null;

export async function createDatabasePool() {
  // The password in DSN may include URI decoded characters
  const uriEncodedPassword = encodeURIComponent(env.db.password);
  const redactedDsn = connectionDsn.replace(uriEncodedPassword, '********');
  logger.info(`Connecting to ${redactedDsn}`);
  pool = await createPool(connectionDsn, {
    PgPool: SharedPool,
    typeParsers: [
      ...createTypeParserPreset(),
      // Convert timestamps to JS dates
      {
        name: 'timestamp',
        parse(value) {
          return new Date(value + ' UTC');
        },
      },
      {
        name: 'timestamptz',
        parse(value) {
          return new Date(value);
        },
      },
    ],
  });
}

export function getPool() {
  if (pool) {
    return pool;
  } else {
    throw Error('DB pool is not initialized');
  }
}

export const sql = {
  ...slonikSql,
  unsafe: undefined,
  untyped: slonikSql.unsafe,
};

export function textToTsQuery(text: string) {
  const searchTerm =
    text
      ?.trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ') || null;
  if (!searchTerm) {
    return null;
  }

  return sql.fragment`to_tsquery('simple', ${searchTerm})`;
}
