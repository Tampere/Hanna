import { TRPCError } from '@trpc/server';
import { hasWritePermission, ownsProject } from 'tre-hanna-shared/src/schema/userPermissions';
import { z } from 'zod';

import { getPermissionContext } from '@backend/components/project/base';
import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/investment';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { investmentProjectSchema } from '@shared/schema/project/investment';

export const createInvestmentProjectRouter = (t: TRPC) => {
  return t.router({
    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { projectId } = input;
      return getProject(projectId);
    }),

    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input, null);
    }),

    upsert: t.procedure.input(investmentProjectSchema).mutation(async ({ input, ctx }) => {
      if (!ctx.user.permissions.includes('investmentProject.write') && !input.projectId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
      } else if (input.projectId) {
        const permissionCtx = await getPermissionContext(input.projectId);
        if (hasWritePermission(ctx.user, permissionCtx) || ownsProject(ctx.user, permissionCtx)) {
          return await projectUpsert(input, ctx.user);
        }
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
      } else {
        return await projectUpsert(input, ctx.user);
      }
    }),
  });
};
