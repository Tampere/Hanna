import { z } from 'zod';

import { getSapActuals, getSapProject } from '@backend/components/sap/dataImport';
import { getPool, sql } from '@backend/db';

import { TRPC } from '.';

export const createSapRouter = (t: TRPC) =>
  t.router({
    getSapProject: t.procedure
      .input(z.object({ projectId: z.string() }))
      .mutation(async ({ input }) => {
        return getSapProject(input.projectId);
      }),

    getSapActuals: t.procedure
      .input(z.object({ projectId: z.string(), year: z.string() }))
      .mutation(async ({ input }) => {
        return getSapActuals(input.projectId, input.year);
      }),

    getWBSByProjectId: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        const result = await getPool().maybeOne(sql.type(z.object({ sapProjectId: z.string() }))`
          SELECT sap_project_id AS "sapProjectId"
          FROM app.project
          WHERE id = ${input.projectId}
        `);
        if (result?.sapProjectId) {
          const sapProject = await getSapProject(result?.sapProjectId);
          return sapProject?.wbs.map((wbs) => {
            return {
              wbsId: wbs.wbsId,
              shortDescription: wbs.shortDescription,
            };
          });
        } else {
          return null;
        }
      }),
  });
