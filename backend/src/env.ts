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
  nodeEnv: z.enum(['development', 'production', 'test']),
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
  sapWebService: z.object({
    basicAuthUser: z.string(),
    basicAuthPass: z.string(),
    projectInfoEndpoint: z.string(),
    projectInfoTTLSeconds: z.number(),
    actualsEndpoint: z.string(),
    actualsInfoTTLSeconds: z.number(),
  }),
  enabledFeatures: z.object({
    sapActuals: z.boolean(),
  }),
  report: z.object({
    queueConcurrency: z.number(),
  }),
  email: z.object({
    host: z.string(),
    port: z.number(),
    secure: z.boolean(),
    maxConnections: z.number(),
    senderAddress: z.string(),
    senderName: z.string(),
    queueConcurrency: z.number(),
    auth: z.discriminatedUnion('method', [
      z.object({
        method: z.literal('oauth'),
        clientId: z.string(),
        clientSecret: z.string(),
        refreshToken: z.string(),
        accessUrl: z.string(),
      }),
      z.object({
        method: z.literal('login'),
        username: z.string(),
        password: z.string(),
      }),
      z.object({
        method: z.literal('none'),
      }),
    ]),
  }),
  detailplan: z.object({
    notificationRecipients: z.array(z.string()),
    notificationSignatureFrom: z.string(),
  }),
  proxy: z.object({
    georaster: z.object({
      upstream: z.string(),
      username: z.string(),
      password: z.string(),
    }),
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
    sapWebService: {
      basicAuthUser: process.env.SAP_WS_BASIC_AUTH_USER,
      basicAuthPass: process.env.SAP_WS_BASIC_AUTH_PASS,
      projectInfoEndpoint: process.env.SAP_WS_PROJECTINFO_ENDPOINT,
      projectInfoTTLSeconds: Number(process.env.SAP_WS_PROJECTINFO_TTL_SECONDS),
      actualsEndpoint: process.env.SAP_WS_ACTUALS_ENDPOINT,
      actualsInfoTTLSeconds: Number(process.env.SAP_WS_ACTUALS_TTL_SECONDS),
    },
    enabledFeatures: {
      sapActuals: process.env.FEATURE_ENABLED_SAP_ACTUALS === 'true',
    },
    report: {
      queueConcurrency: Number(process.env.REPORT_QUEUE_CONCURRENCY),
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      maxConnections: Number(process.env.EMAIL_MAX_CONNECTIONS),
      queueConcurrency: Number(process.env.EMAIL_QUEUE_CONCURRENCY),
      senderAddress: process.env.EMAIL_SENDER_ADDRESS,
      senderName: process.env.EMAIL_SENDER_NAME,
      auth:
        process.env.EMAIL_AUTH_METHOD === 'oauth'
          ? {
              method: 'oauth',
              clientId: process.env.EMAIL_AUTH_CLIENT_ID,
              clientSecret: process.env.EMAIL_AUTH_CLIENT_SECRET,
              refreshToken: process.env.EMAIL_AUTH_REFRESH_TOKEN,
              accessUrl: process.env.EMAIL_AUTH_ACCESS_URL,
            }
          : process.env.EMAIL_AUTH_METHOD === 'login'
          ? {
              method: 'login',
              username: process.env.EMAIL_USERNAME,
              password: process.env.EMAIL_PASSWORD,
            }
          : {
              method: 'none',
            },
    },
    detailplan: {
      notificationRecipients: process.env.DETAILPLAN_NOTIFICATION_RECIPIENTS?.split(',') ?? [],
      notificationSignatureFrom: process.env.DETAILPLAN_NOTIFICATION_SIGNATURE_FROM,
    },
    proxy: {
      georaster: {
        upstream: process.env.PROXY_GEORASTER_UPSTREAM,
        username: process.env.PROXY_GEORASTER_USERNAME,
        password: process.env.PROXY_GEORASTER_PASSWORD,
      },
    },
  } as z.infer<typeof schema>);
}

export const env = getEnv();
