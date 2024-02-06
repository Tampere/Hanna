import fastifyHttpProxy from '@fastify/http-proxy';
import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { env } from '@backend/env';

export function georasterProxy(
  server: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: () => void,
) {
  server.register(fastifyHttpProxy, {
    upstream: env.proxy.georaster.upstream,
    prefix: '/proxy/georaster',
    replyOptions: {
      rewriteRequestHeaders: (_request, headers) => {
        return {
          ...headers,
          Authorization: `Basic ${Buffer.from(
            `${env.proxy.georaster.username}:${env.proxy.georaster.password}`,
          ).toString('base64')}`,
        };
      },
    },
  });

  done();
}
