import { TRPCError } from '@trpc/server';
import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import { projectObject } from '@shared/schema/projectObject';

export const createProjectObjectRouter = (t: TRPC) =>
  t.router({
    create: t.procedure.input(z.object({ foo: z.string() })).mutation(async ({ input }) => {
      const resultSchema = z.object({ bar: z.number() });
      const dbResult = await getPool().one(sql.type(resultSchema)`
        SELECT 1
      `);
      return dbResult.bar;
    }),
    get: t.procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {}),
    delete: t.procedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
      throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED' });
    }),
  });
