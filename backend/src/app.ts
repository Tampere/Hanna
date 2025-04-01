import fastifyCompress from '@fastify/compress';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { TRPCError } from '@trpc/server';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { getErrorShape } from '@trpc/server/shared';
import fastify, { FastifyBaseLogger } from 'fastify';
import { dirname, join } from 'path';
import { serialize } from 'superjson';
import { fileURLToPath } from 'url';

import { registerAuth } from '@backend/auth.js';
import { fileHandler } from '@backend/components/file/index.js';
import healthApi from '@backend/components/health/api.js';
import reportDownloadApi from '@backend/components/report/downloadApi.js';
import {
  setupScheduledSyncQueue as setupDailySapSyncQueue,
  setupSapSyncQueue,
} from '@backend/components/sap/syncQueue.js';
import syncQueueApi from '@backend/components/sap/syncQueueApi.js';
import { ActualsService, ProjectInfoService } from '@backend/components/sap/webservice.js';
import { setupDetailPlanGeomSyncQueue } from '@backend/components/taskQueue/detailPlanGeomSyncQueue.js';
import { createDatabasePool, createPgPool } from '@backend/db.js';
import { env } from '@backend/env.js';
import { logger } from '@backend/logging.js';
import { getClient } from '@backend/oidc.js';
import { appRouter, createContext } from '@backend/router/index.js';

import { registerApiKeyRoutes } from './apiKey.js';
import { georasterProxy } from './components/proxy/georaster.js';
import { setupBlanketContractReportQueue } from './components/sap/blanketContractReportQueue.js';
import { setupEnvironmentCodeReportQueue } from './components/sap/environmentCodeReportQueue.js';
import { initializeTaskQueue } from './components/taskQueue/index.js';
import { setupMailQueue } from './components/taskQueue/mailQueue.js';
import { setupReportQueue } from './components/taskQueue/reportQueue.js';
import { setupWorkTableReportQueue } from './components/taskQueue/workTableReportQueue.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  ProjectInfoService.initialize({
    endpoint: env.sapWebService.projectInfoEndpoint,
    basicAuthUser: env.sapWebService.basicAuthUser,
    basicAuthPass: env.sapWebService.basicAuthPass,
    wsdlResourcePath: 'resources/projectinfo.wsdl',
  });

  ActualsService.initialize({
    endpoint: env.sapWebService.actualsEndpoint,
    basicAuthUser: env.sapWebService.basicAuthUser,
    basicAuthPass: env.sapWebService.basicAuthPass,
    wsdlResourcePath: 'resources/actuals.wsdl',
  });

  await createDatabasePool();
  await initializeTaskQueue();

  await Promise.all([
    setupReportQueue(),
    setupMailQueue(),
    env.enabledFeatures.sapSync ? setupSapSyncQueue() : null,
    env.enabledFeatures.sapSync ? setupDailySapSyncQueue() : null,
    env.enabledFeatures.sapSync ? setupEnvironmentCodeReportQueue() : null,
    env.enabledFeatures.sapSync ? setupBlanketContractReportQueue() : null,
    setupDetailPlanGeomSyncQueue(),
    setupWorkTableReportQueue(),
  ]);
  // https://github.com/fastify/fastify/issues/4960
  const server = fastify({
    logger: logger as FastifyBaseLogger,
    trustProxy: 1,
    bodyLimit: 1024 * 1024 * 7.5, // 7,5 MiB, roughly 5MiB with base64 overhead
  });
  const oidcClient = await getClient();

  registerApiKeyRoutes(server, { prefix: '/api/v1/admin', apis: [syncQueueApi] });

  // Register auth-related functionality for server instance
  registerAuth(server, {
    oidcOpts: {
      loginPath: '/api/v1/auth/login',
      callbackPath: '/api/v1/auth/callback',
      scope: 'email openid',
      client: oidcClient,
    },
    pgPool: createPgPool(),
    sessionOpts: {
      cookieSecret: env.cookieSecret,
      cookieMaxAge: 1000 * 60 * 60,
    },
    publicRouterPaths: new Set([
      '/api/v1/auth/login',
      '/api/v1/auth/callback',
      '/api/v1/ping',
      '/api/v1/health',
      '/api/v1/files',
      '/*',
    ]),
  });

  server.register(fastifySensible);
  server.register(fastifyCompress, { requestEncodings: ['gzip'], encodings: ['gzip'] });
  server.setNotFoundHandler((req, reply) => {
    const url = req.raw.url;
    // For not found backend routes -> throw a 404 error
    if (['/api', '/trpc', '/proxy'].some((prefix) => url?.startsWith(prefix))) {
      throw server.httpErrors.notFound(`${url} not found`);
    }
    // For other routes -> let the frontend handle the client-side routing
    reply.sendFile('index.html');
  });

  server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter, createContext },
  });

  // Serve frontend files as static files from the root URL
  server.register(fastifyStatic, {
    root: join(__dirname, '../static'),
    prefix: '/',
  });

  server.get('/api/v1/ping', async (req) => {
    logger.info(`Ping request received, headers: ${JSON.stringify(req.headers)}, ips: ${req.ips}`);
    return { ping: 'pong', now: new Date() };
  });

  server.get('/redirect-to-elomake', async (_req, reply) => {
    if (env.projectFormLink) {
      reply.redirect(env.projectFormLink);
    }
  });

  server.register(healthApi, { prefix: '/api/v1' });
  server.register(fileHandler, { prefix: '/api/v1/files' });
  server.register(reportDownloadApi, { prefix: '/api/v1' });
  server.register(georasterProxy);

  const defaultErrorHandler = server.errorHandler;

  server.setErrorHandler((error, req, res) => {
    // Simulate a TRPC error response if such an error was thrown outside a TRPC router
    if (error instanceof TRPCError) {
      const shape = getErrorShape({
        error,
        type: 'unknown',
        path: undefined,
        input: undefined,
        ctx: undefined,
        config: appRouter._def._config,
      });

      return res.status(shape.data.httpStatus).send({ error: serialize(shape) });
    }

    // For other errors use the default Fastify error handler
    return defaultErrorHandler(error, req, res);
  });

  server.listen({ host: '0.0.0.0', port: env.serverPort }, (err) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

run();
