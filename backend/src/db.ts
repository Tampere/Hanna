import pg from 'pg';
import {
  DatabasePool,
  createPool,
  createTypeParserPreset,
  sql as slonikSql,
  stringifyDsn,
} from 'slonik';

import { env } from '@backend/env.js';
import { logger } from '@backend/logging.js';

export const connectionDsn =
  stringifyDsn({
    databaseName: env.db.database,
    host: env.db.host,
    port: env.db.port,
    username: env.db.username,
    password: env.db.password,
  }) + `?sslmode=${env.db.sslMode}`;

let pool: DatabasePool | null = null;

export function createPgPool() {
  return new pg.Pool({
    connectionString: connectionDsn,
    connectionTimeoutMillis: 1000,
    idleTimeoutMillis: 5000,
    max: 5,
  });
}

export async function createDatabasePool() {
  // The password in DSN may include URI decoded characters
  const uriEncodedPassword = encodeURIComponent(env.db.password);
  const redactedDsn = connectionDsn.replace(uriEncodedPassword, '********');
  logger.info(`Connecting to ${redactedDsn}`);
  pool = await createPool(connectionDsn, {
    connectionTimeout: 1000,
    idleTimeout: 5000,
    maximumPoolSize: 10,
    typeParsers: [
      ...createTypeParserPreset(),
      // Convert int8 to numbers
      {
        name: 'int8',
        parse(value) {
          return parseInt(value, 10);
        },
      },
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
