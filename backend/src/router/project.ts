import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

export const createProjectRouter = (t: TRPC) =>
  t.router({
    getAll: t.procedure.input(z.object({ asdf: z.string() })).query(() => {
      return { foo: 'bar' };
    }),
    create: t.procedure
      .input(z.object({ description: z.string(), name: z.string() }))
      .mutation(async ({ input }) => {
        const result = await getPool().one(
          sql`INSERT INTO app.project (description, project_name) VALUES (${input.description}, ${input.name}) RETURNING id`
        );

        return result;
      }),
  });
