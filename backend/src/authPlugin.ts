import fastifyCookie from '@fastify/cookie';
import formBody from '@fastify/formbody';
import { Authenticator } from '@fastify/passport';
import fastifySession from '@fastify/session';
import pgStore from 'connect-pg-simple';
import { FastifyInstance, FastifyPluginOptions, PassportUser } from 'fastify';
import { BaseClient, Strategy, TokenSet, UserinfoResponse } from 'openid-client';
import { Pool } from 'pg';

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
}

export async function authPlugin(fastify: FastifyInstance, opts: AuthPluginOpts, done: () => void) {
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
          scope: 'email openid',
        },
      },
      function verify(
        _tokenset: TokenSet,
        userinfo: UserinfoResponse,
        authDone: (err: Error | null, user?: PassportUser) => void
      ) {
        if (userinfo.email) {
          authDone(null, { id: userinfo.email });
        } else {
          authDone(new Error('No email in userinfo'));
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

  fastify.get(opts.oidcOpts.loginPath, fastifyPassport.authenticate('oidc'));

  fastify.get(
    opts.oidcOpts.callbackPath,
    fastifyPassport.authenticate('oidc', {
      successRedirect: '/',
      failureRedirect: '/',
    })
  );

  done();
}
