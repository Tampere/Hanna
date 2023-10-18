import fastifyCompress from '@fastify/compress';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { TRPCError } from '@trpc/server';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify, { FastifyBaseLogger } from 'fastify';
import { join } from 'path';
import { serialize } from 'superjson';

import { registerAuth } from '@backend/auth';
import healthApi from '@backend/components/health/api';
import reportDownloadApi from '@backend/components/report/downloadApi';
import {
  setupScheduledSyncQueue as setupDailySapSyncQueue,
  setupSapSyncQueue,
} from '@backend/components/sap/syncQueue';
import syncQueueApi from '@backend/components/sap/syncQueueApi';
import { ActualsService, ProjectInfoService } from '@backend/components/sap/webservice';
import { setupDetailPlanGeomSyncQueue } from '@backend/components/taskQueue/detailPlanGeomSyncQueue';
import { SharedPool, createDatabasePool } from '@backend/db';
import { env } from '@backend/env';
import { logger } from '@backend/logging';
import { getClient } from '@backend/oidc';
import { appRouter, createContext } from '@backend/router';

import { registerApiKeyRoutes } from './apiKey';
import { georasterProxy } from './components/proxy/georaster';
import { setupBlanketContractReportQueue } from './components/sap/blanketContractReportQueue';
import { setupEnvironmentCodeReportQueue } from './components/sap/environmentCodeReportQueue';
import { initializeTaskQueue } from './components/taskQueue';
import { setupMailQueue } from './components/taskQueue/mailQueue';
import { setupReportQueue } from './components/taskQueue/reportQueue';

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
    setupSapSyncQueue(),
    setupDailySapSyncQueue(),
    setupEnvironmentCodeReportQueue(),
    setupBlanketContractReportQueue(),
    setupDetailPlanGeomSyncQueue(),
  ]);
  // https://github.com/fastify/fastify/issues/4960
  const server = fastify({ logger: logger as FastifyBaseLogger });
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
    pgPool: SharedPool.getPool(),
    sessionOpts: {
      cookieSecret: env.cookieSecret,
      cookieMaxAge: 1000 * 60 * 60,
    },
    publicRouterPaths: new Set([
      '/api/v1/auth/login',
      '/api/v1/auth/callback',
      '/api/v1/ping',
      '/api/v1/health',
      '/*',
    ]),
  });

  server.register(fastifySensible);
  server.register(fastifyCompress);
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

  server.get('/api/v1/ping', async () => {
    return { ping: 'pong', now: new Date() };
  });

  server.register(healthApi, { prefix: '/api/v1' });
  server.register(reportDownloadApi, { prefix: '/api/v1' });
  server.register(georasterProxy);

  const defaultErrorHandler = server.errorHandler;

  server.setErrorHandler((error, req, res) => {
    // Simulate a TRPC error response if such an error was thrown outside a TRPC router
    if (error instanceof TRPCError) {
      const shape = appRouter.getErrorShape({
        error,
        type: 'unknown',
        path: undefined,
        input: undefined,
        ctx: undefined,
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
