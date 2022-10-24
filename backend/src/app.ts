import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { join } from 'path';

import { registerAuth } from '@backend/auth';
import { SharedPool, createDatabasePool } from '@backend/db';
import { env } from '@backend/env';
import { logger } from '@backend/logging';
import { getClient } from '@backend/oidc';
import { appRouter, createContext } from '@backend/router';

async function run() {
  await createDatabasePool();

  const server = fastify({ logger });
  const oidcClient = await getClient();

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
      '/*',
    ]),
  });

  server.register(fastifySensible);
  server.setNotFoundHandler((req, reply) => {
    const url = req.raw.url;
    // For not found /api or /trpc routes -> throw a 404 error
    if (url?.startsWith('/api') || url?.startsWith('/trpc')) {
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

  server.listen({ host: '0.0.0.0', port: env.serverPort }, (err) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

run();
