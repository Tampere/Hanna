import { z } from 'zod';

import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/investment';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { investmentProjectSchema } from '@shared/schema/project/investment';

export const createInvestmentProjectRouter = (t: TRPC) =>
  t.router({
    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input);
    }),

    upsert: t.procedure.input(investmentProjectSchema).mutation(async ({ input, ctx }) => {
      return projectUpsert(input, ctx.user);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),
  });
