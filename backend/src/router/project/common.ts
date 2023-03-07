import { z } from 'zod';

import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/common';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { commonProjectSchema } from '@shared/schema/project/common';

export const createCommonProjectRouter = (t: TRPC) =>
  t.router({
    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input);
    }),

    upsert: t.procedure.input(commonProjectSchema).mutation(async ({ input, ctx }) => {
      return projectUpsert(input, ctx.user);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),
  });
