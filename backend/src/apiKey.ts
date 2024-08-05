import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { env } from './env';

type FastifyRouteHandler = (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
) => void;

interface Options {
  prefix: string;
  apis: FastifyRouteHandler[];
}

export function registerApiKeyRoutes(server: FastifyInstance, opts: Options) {
  server.register(
    (server, _opts, done) => {
      server.addHook('preValidation', async (req, reply) => {
        // Deny access when no API key has been defined or the given api key doesn't match
        if (!env.adminApiKey || req.headers['x-api-key'] !== env.adminApiKey) {
          reply.code(401);
          throw new Error('Unauthorized');
        }

        // Create a user for the session
        req.user = {
          email: 'apikeyuser',
          id: 'apikeyuser',
          name: 'API key user',
          role: 'Hanna.Admin',
          permissions: [],
        };
      });

      // Register the given routes
      opts.apis.forEach((api) => {
        server.register(api);
      });

      done();
    },
    { prefix: opts.prefix },
  );
}
