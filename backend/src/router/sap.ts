import { sql } from 'slonik';
import { z } from 'zod';

import { getSapProject } from '@backend/components/sap/projectImport';
import { getPool } from '@backend/db';
import { logger } from '@backend/logging';

import { TRPC } from '.';

export const createSapRouter = (t: TRPC) =>
  t.router({
    getSapProject: t.procedure
      .input(z.object({ projectId: z.string() }))
      .mutation(async ({ input }) => {
        return getSapProject(input.projectId);
      }),
  });
