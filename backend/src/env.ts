import 'dotenv/config';
import { z } from 'zod';

if (process.env.NODE_ENV === 'development') {
  try {
    require('../.env');
  } catch (err) {
    // Ignore errors - only used for restarting server on .env changes
  }
}

const schema = z.object({
  nodeEnv: z.enum(['development', 'production']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  serverPort: z.number(),
  cookieSecret: z.string(),
  db: z.object({
    host: z.string(),
    port: z.number(),
    database: z.string(),
    username: z.string(),
    password: z.string(),
    sslMode: z.enum(['disable', 'no-verify', 'require']),
  }),
  oidc: z.object({
    discovery_url: z.string(),
    client_id: z.string(),
    client_secret: z.string(),
    redirect_uri: z.string(),
  }),
});

function getEnv() {
  return schema.parse({
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    serverPort: Number(process.env.SERVER_PORT),
    cookieSecret: process.env.COOKIE_SECRET,
    db: {
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      database: process.env.PG_DATABASE,
      username: process.env.PG_USER,
      password: process.env.PG_PASS,
      sslMode: process.env.PG_SSLMODE || 'disable',
    },
    oidc: {
      discovery_url: process.env.OIDC_CLIENT_DISCOVERY_URL,
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uri: process.env.OIDC_REDIRECT_URI,
    },
  });
}

export const env = getEnv();
