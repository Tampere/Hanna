import { timingSafeEqual } from 'crypto';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { env } from './env.js';

type FastifyRouteHandler = (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void,
) => void;

interface Options {
  prefix: string;
  apis: FastifyRouteHandler[];
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function registerApiKeyRoutes(server: FastifyInstance, opts: Options) {
  server.register(
    (server, _opts, done) => {
      server.addHook('preValidation', async (req, reply) => {
        const apiKey = req.headers['x-api-key'];

        // Deny access when no API key has been defined or the given api key doesn't match
        if (!env.adminApiKey || typeof apiKey !== 'string' || !safeCompare(apiKey, env.adminApiKey)) {
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
