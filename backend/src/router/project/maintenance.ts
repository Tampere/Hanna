import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getPermissionContext } from '@backend/components/project/base';
import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/maintenance';
import { TRPC } from '@backend/router';

import { projectIdSchema } from '@shared/schema/project/base';
import { maintenanceProjectSchema } from '@shared/schema/project/maintenance';
import { hasPermission, hasWritePermission, ownsProject } from '@shared/schema/userPermissions';

export const createMaintenanceProjectRouter = (t: TRPC) => {
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
        z.object({ project: maintenanceProjectSchema, keepOwnerRights: z.boolean().optional() }),
      )
      .mutation(async ({ input, ctx }) => {
        const { project, keepOwnerRights } = input;

        if (!hasPermission(ctx.user, 'maintenanceProject.write') && !project.projectId) {
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
