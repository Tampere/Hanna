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
      rewriteRequestHeaders: (request, headers) => {
        const withAuth = Boolean(
          request.query &&
            typeof request.query === 'object' &&
            'layer' in request.query &&
            request.query['layer'] === 'georaster:kantakartta_mml_harmaa_EPSG_3067',
        );

        return {
          ...headers,
          ...(withAuth && {
            Authorization: `Basic ${Buffer.from(
              `${env.proxy.georaster.username}:${env.proxy.georaster.password}`,
            ).toString('base64')}`,
          }),
        };
      },
    },
  });

  done();
}
