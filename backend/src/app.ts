import fastifyCookie from '@fastify/cookie';
import formBody from '@fastify/formbody';
import { Authenticator } from '@fastify/passport';
import fastifySession from '@fastify/session';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import pgStore from 'connect-pg-simple';
import fastify, { PassportUser } from 'fastify';
import { Strategy, TokenSet, UserinfoResponse } from 'openid-client';

import { SharedPool, createDatabasePool } from '@src/db';
import { env } from '@src/env';
import { logger } from '@src/logging';
import { getClient } from '@src/oidc';
import { appRouter } from '@src/router';
import { createContext } from '@src/router/context';

async function run() {
  await createDatabasePool();

  const server = fastify({ logger });

  server.register(formBody);
  server.register(fastifyCookie);

  const PGStore = pgStore(fastifySession as any);
  const store = new PGStore({ schemaName: 'app', pool: SharedPool.getPool() });
  server.register(fastifySession, {
    store: store as any,
    secret: env.cookieSecret,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 1000,
      // OIDC auth flows require this so that redirect to callback url will get the cookie
      sameSite: 'none',
    },
  });

  const fastifyPassport = new Authenticator();
  server.register(fastifyPassport.initialize());
  server.register(fastifyPassport.secureSession());

  fastifyPassport.use(
    'oidc',
    new Strategy(
      {
        client: await getClient(),
        params: {
          scope: 'email openid',
        },
      },
      function verify(
        _tokenset: TokenSet,
        userinfo: UserinfoResponse,
        done: (err: Error | null, user?: PassportUser) => void
      ) {
        if (userinfo.email) {
          done(null, { id: userinfo.email });
        } else {
          done(new Error('No email in userinfo'));
        }
      }
    )
  );

  fastifyPassport.registerUserSerializer(async (user: PassportUser) => {
    return JSON.stringify(user);
  });

  fastifyPassport.registerUserDeserializer(async (id) => {
    return id;
  });

  server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter, createContext },
  });

  server.get('/api/v1/ping', async (req) => {
    return { ping: 'pong', now: new Date() };
  });

  server.get('/api/v1/auth/login', fastifyPassport.authenticate('oidc'));

  server.get(
    '/api/v1/auth/callback',
    fastifyPassport.authenticate('oidc', {
      successRedirect: '/',
      failureRedirect: '/',
    })
  );

  server.listen({ host: '0.0.0.0', port: env.serverPort }, (err) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
  });
}

run();
