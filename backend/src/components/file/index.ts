import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db.js';

import { User } from '@shared/schema/user.js';
import { isAdmin } from '@shared/schema/userPermissions.js';

const ImageSchema = z.object({
  name: z.string(),
  type: z.string(),
  data: z.string().refine((val) => {
    return /^[A-Za-z0-9+/=]+$/.test(val);
  }, 'Invalid Base64 format'), // Base64-encoded data
});

const imageIdSchema = z.object({
  imageid: z.string().regex(/^\d+$/, 'Image id must be a number'),
});

export const fileHandler = (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: () => void,
) => {
  fastify.get('/:imageid', async function (req, reply) {
    const parseResult = imageIdSchema.safeParse(req.params);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid image ID' });
    }
    const { imageid } = parseResult.data;

    const result = await getPool().maybeOne(
      sql.type(
        z.object({
          filename: z.string(),
          mime_type: z.string(),
          data: z.instanceof(Buffer),
        }),
      )`SELECT filename, mime_type, data FROM app.images WHERE id = ${imageid}`,
    );

    if (!result) {
      return reply.code(404).send({ error: 'Image not found' });
    }

    const { mime_type, data } = result;
    reply.header('Content-Type', mime_type);
    await reply.send(data);
  });

  fastify.post('/', async function (req, reply) {
    const user = JSON.parse(req.user as any) as User;

    if (!isAdmin(user.role)) {
      return reply.status(400).send({ error: 'UNAUTHORIZED' });
    }

    const data = ImageSchema.parse(req.body);

    const imageBuffer = Buffer.from(data.data, 'base64');

    const fileid = await getPool().oneFirst(
      sql.type(z.string())`INSERT INTO app.images (filename, mime_type, data)
        VALUES (${data.name}, ${data.type}, ${sql.binary(imageBuffer)})
      RETURNING id`,
    );

    return reply.send({ fileid });
  });
  done();
};
