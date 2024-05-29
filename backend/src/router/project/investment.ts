import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getPermissionContext } from '@backend/components/project/base';
import {
  getParticipatedProjects,
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/investment';
import { listProjects } from '@backend/components/project/search';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { investmentProjectSchema } from '@shared/schema/project/investment';
import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';

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
        z.object({ project: investmentProjectSchema, keepOwnerRights: z.boolean().optional() }),
      )
      .mutation(async ({ input, ctx }) => {
        const { project, keepOwnerRights } = input;

        if (!hasPermission(ctx.user, 'investmentProject.write') && !project.projectId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        }
        if (project.projectId) {
          const permissionCtx = await getPermissionContext(project.projectId);

          if (
            !hasWritePermission(ctx.user, permissionCtx) &&
            !ownsProject(ctx.user, permissionCtx)
          ) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
          }
        }
        return await projectUpsert(project, ctx.user, keepOwnerRights);
      }),
    getParticipatedProjects: t.procedure.query(async ({ ctx }) => {
      if (isAdmin(ctx.user.role)) {
        return listProjects({ projectType: 'investmentProject' });
      }
      return getParticipatedProjects(ctx.user.id);
    }),
  });
};
