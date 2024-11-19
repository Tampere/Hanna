import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getPermissionContext } from '@backend/components/project/base.js';
import { updateProjectBudget } from '@backend/components/project/index.js';
import {
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/maintenance.js';
import { getPool } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';
import { createAccessMiddleware } from '@backend/router/project/base.js';

import { projectIdSchema } from '@shared/schema/project/base.js';
import { maintenanceBudgetUpdateSchema } from '@shared/schema/project/index.js';
import { maintenanceProjectSchema } from '@shared/schema/project/maintenance.js';
import { hasPermission, hasWritePermission, ownsProject } from '@shared/schema/userPermissions.js';

export const createMaintenanceProjectRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);
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
    updateBudget: t.procedure
      .input(maintenanceBudgetUpdateSchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectBudget(tx, input.projectId, input.budgetItems, ctx.user.id);
        });
      }),
  });
};
