import fastifyCookie from '@fastify/cookie';
import formBody from '@fastify/formbody';
import { Authenticator } from '@fastify/passport';
import fastifySession from '@fastify/session';
import { TRPCError } from '@trpc/server';
import pgStore from 'connect-pg-simple';
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, PassportUser } from 'fastify';
import { BaseClient, Strategy, TokenSet, UserinfoResponse } from 'openid-client';
import { Pool } from 'pg';

import { RoleClaim, UserRole } from '@shared/schema/userPermissions';

import { logger } from './logging';
import { upsertUser } from './user';

interface SessionOpts {
  cookieSecret: string;
  cookieMaxAge: number;
}

interface OIDCOpts {
  loginPath: string;
  callbackPath: string;
  scope: string;
  client: BaseClient;
}

interface AuthPluginOpts extends FastifyPluginOptions {
  oidcOpts: OIDCOpts;
  sessionOpts: SessionOpts;
  pgPool: Pool;
  publicRouterPaths: Set<string>;
}

function getUserRole(roles: RoleClaim[]): UserRole {
  if (roles.includes('Hanna_admins') || roles.includes('Hanna_test_admins')) {
    return 'Hanna.Admin';
  } else if (roles.includes('Hanna_users') || roles.includes('Hanna_test_users')) {
    return 'Hanna.User';
  }
  logger.warn(
    `User role not identified at roles claim, received roles: ${JSON.stringify(roles, null, 2)}`,
  );
  return 'Hanna.User';
}

export function registerAuth(fastify: FastifyInstance, opts: AuthPluginOpts) {
  fastify.register(formBody);
  fastify.register(fastifyCookie);

  const PGStore = pgStore(fastifySession as any);
  const store = new PGStore({ schemaName: 'app', pool: opts.pgPool });
  fastify.register(fastifySession, {
    store: store as any,
    secret: opts.sessionOpts.cookieSecret,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: opts.sessionOpts.cookieMaxAge,
      // OIDC auth flows require this so that redirect to callback url will get the cookie
      sameSite: 'none',
    },
  });

  const fastifyPassport = new Authenticator();
  fastify.register(fastifyPassport.initialize());
  fastify.register(fastifyPassport.secureSession());

  fastifyPassport.use(
    'oidc',
    new Strategy(
      {
        client: opts.oidcOpts.client,
        params: {
          scope: 'email openid profile roles',
        },
      },
      async function verify(
        tokenset: TokenSet,
        userinfo: UserinfoResponse & { roles?: RoleClaim[] },
        authDone: (err: Error | null, user?: PassportUser) => void,
      ) {
        logger.info(`TOKENSET: ${JSON.stringify(tokenset, null, 2)}`);
        logger.info(`USERINFO: ${JSON.stringify(userinfo, null, 2)}`);
        const id = userinfo.sub;
        const role = getUserRole(userinfo?.roles ?? []);
        if (id) {
          const user = {
            id,
            name: String(userinfo.name),
            email: String(userinfo.upn),
            role,
          };
          // Update user to the database
          const dbUser = await upsertUser(user);
          if (dbUser) {
            authDone(null, dbUser);
          }
        } else {
          authDone(new Error('No identifier found in userinfo'));
        }
      },
    ),
  );

  fastifyPassport.registerUserSerializer(async (user: PassportUser) => {
    return JSON.stringify(user);
  });

  fastifyPassport.registerUserDeserializer(async (id) => {
    return id;
  });

  fastify.addHook('preValidation', async (req) => {
    if (opts.publicRouterPaths.has(req.routeOptions.url)) {
      return;
    }
    if (!req.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
  });

  fastify.get('/api/v1/auth/user', async (req) => {
    if (req.user) {
      return req.user;
    }
  });

  // Logout route
  fastify.get('/logout', (req, res) => {
    req.session.destroy((error) => {
      if (error) logger.error(error);

      if (req.session) {
        req.logOut();
      }
      res.redirect(process.env.AUTH_LOGOUT_URL as string);
    });
  });

  fastify.get(
    opts.oidcOpts.loginPath,
    function (req: FastifyRequest<{ Querystring: { redirect?: string } }>, res) {
      // Store the redirect URL in session data
      if (req.query.redirect) {
        req.session.set('redirectUrl', req.query.redirect);
      }

      return fastifyPassport.authenticate('oidc').call(fastify, req, res);
    },
  );

  fastify.get(opts.oidcOpts.callbackPath, (req, res) => {
    fastifyPassport
      .authenticate('oidc', async (req, res, error, user) => {
        // If there are errors in login (e.g. already used or expired code), redirect to the front page
        if (error || !user) {
          return res.redirect('/');
        }

        try {
          await req.login(user);
        } catch (error) {
          return res.redirect('/');
        }

        // Redirect to the original URL if one was found from session, otherwise to the home page
        const redirectPath = req.session.get('redirectUrl') ?? '/';
        return res.redirect(redirectPath);
      })
      .call(fastify, req, res);
  });
}
