import { z } from 'zod';

import { getSapActuals, getSapProject } from '@backend/components/sap/dataImport';

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
  });
