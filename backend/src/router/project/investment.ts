import { TRPCError } from '@trpc/server';
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
import { hasWritePermission, ownsProject } from '@shared/schema/userPermissions';

export const createInvestmentProjectRouter = (t: TRPC) => {
  return t.router({
    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { projectId } = input;
      return getProject(projectId);
    }),

    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return validateUpsertProject(input, null);
    }),

    upsert: t.procedure
      .input(
        z.object({ project: investmentProjectSchema, keepOwnerRights: z.boolean().optional() })
      )
      .mutation(async ({ input, ctx }) => {
        const { project, keepOwnerRights } = input;

        if (!ctx.user.permissions.includes('investmentProject.write') && !project.projectId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        } else if (project.projectId) {
          const permissionCtx = await getPermissionContext(project.projectId);

          if (hasWritePermission(ctx.user, permissionCtx) || ownsProject(ctx.user, permissionCtx)) {
            return await projectUpsert(project, ctx.user, keepOwnerRights);
          }
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        } else {
          return await projectUpsert(project, ctx.user, keepOwnerRights);
        }
      }),
  });
};
