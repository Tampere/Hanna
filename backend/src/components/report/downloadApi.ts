import { FastifyInstance, FastifyPluginOptions } from 'fastify';

import { getPool, sql } from '@backend/db';

export default function (server: FastifyInstance, _opts: FastifyPluginOptions, done: () => void) {
  server.get('/report/file', async (request, reply) => {
    const { id } = request.query as { id: string };
    const dbResult = await getPool().maybeOne(sql.untyped`
      SELECT
        report_filename AS "filename",
        report_data AS "data"
      FROM app.report_file
      WHERE pgboss_job_id = ${id}
    `);

    if (!dbResult) {
      reply.statusCode = 404;
      reply.send({ error: 'Resource not found' });
      return;
    }

    reply.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    reply.header('Content-Disposition', `attachment; filename=${dbResult.filename}`);
    return reply.send(dbResult.data);
  });

  done();
}
