import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import { newProjectSchema, projectSearchSchema, searchResultSchema } from '@shared/schema/project';

export const createProjectRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(projectSearchSchema).query(async () => {
      const results = await getPool().query(sql`
        SELECT
          id,
          project_name AS "projectName",
          description,
          start_date AS "startDate",
          end_date AS "endDate"
        FROM app.project
        ORDER BY start_date DESC
      `);
      return searchResultSchema.parse(results.rows);
    }),

    create: t.procedure.input(newProjectSchema).mutation(async ({ input }) => {
      const { projectName, description, startDate, endDate } = input;
      return getPool().one(
        sql.type(z.object({ id: z.string() }))`
          INSERT INTO app.project (project_name, description, start_date, end_date)
          VALUES (${projectName}, ${description}, ${startDate.toISOString()}, ${endDate.toISOString()})
          RETURNING id
        `
      );
    }),
  });
