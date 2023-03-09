import { z } from 'zod';

import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/detailplan';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { detailplanProjectSchema } from '@shared/schema/project/detailplan';

export const createDetailplanProjectRouter = (t: TRPC) =>
  t.router({
    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input);
    }),

    upsert: t.procedure.input(detailplanProjectSchema).mutation(async ({ input, ctx }) => {
      return projectUpsert(input, ctx.user);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),
  });
