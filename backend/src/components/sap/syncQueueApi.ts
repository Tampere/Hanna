import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';

import {
  cancelPendingSyncJobs,
  getSyncSummary,
  manuallyStartSync,
  scheduleSync,
  unscheduleSync,
} from './syncQueue';

export default function (server: FastifyInstance, _opts: FastifyPluginOptions, done: () => void) {
  server.register(
    (server, _opts, done) => {
      server.get(
        '/summary',
        async (
          req: FastifyRequest<{
            Querystring: { limit?: number };
          }>
        ) => {
          const limit = req.query.limit;
          const result = await getSyncSummary(limit);
          return result;
        }
      );

      server.post('/cancel', async () => {
        await cancelPendingSyncJobs();
        return { status: 'ok' };
      });

      server.post('/start', async () => {
        await manuallyStartSync();
        return { status: 'ok' };
      });

      server.post('/schedule', async () => {
        await scheduleSync();
        return { status: 'ok' };
      });

      server.post('/unschedule', async () => {
        await unscheduleSync();
        return { status: 'ok' };
      });

      done();
    },
    { prefix: '/sap-sync' }
  );

  done();
}
