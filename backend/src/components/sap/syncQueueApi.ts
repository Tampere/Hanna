import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { getPool, sql } from '@backend/db';

import { startDailySync } from './syncQueue';

export default function (server: FastifyInstance, _opts: FastifyPluginOptions, done: () => void) {
  server.post('/start-sap-sync', async (request, reply) => {
    startDailySync();
    reply.send({ status: 'ok' });
  });

  done();
}
