import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getPermissionContext } from '@backend/components/project/base.js';
import { updateProjectBudget } from '@backend/components/project/index.js';
import {
  deleteProjectBudget,
  getParticipatedProjects,
  getProject,
  projectUpsert,
  validateUpsertProject,
} from '@backend/components/project/investment.js';
import { listProjects } from '@backend/components/project/search.js';
import { getPool } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';
import { createAccessMiddleware } from '@backend/router/project/base.js';

import { projectIdSchema } from '@shared/schema/project/base.js';
import { investmentBudgetUpdateSchema } from '@shared/schema/project/index.js';
import { investmentProjectSchema } from '@shared/schema/project/investment.js';
import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions.js';

export const createInvestmentProjectRouter = (t: TRPC) => {
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
    updateBudget: t.procedure
      .input(investmentBudgetUpdateSchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectBudget(tx, input.projectId, input.budgetItems, ctx.user.id);
        });
      }),
    deleteBudget: t.procedure
      .input(z.object({ projectId: z.string(), committees: z.array(z.string()) }))
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return deleteProjectBudget(tx, input.projectId, input.committees, ctx.user.id);
        });
      }),
    palmUpsert: t.procedure
      .input(
        z.object({ projectId: z.string(), palmGrouping: z.string().optional() }),
      )
      .use(withAccess((usr, ctx) => isAdmin(usr.role) || usr.permissions.includes('palmGrouping.write')))
      .mutation(async ({ input, ctx }) => {

        const {projectId, palmGrouping} = input;
        if (!projectId || !projectId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Project ID is required' });
        }
        const baseProject = await getProject(projectId);
        const project = { ...baseProject, palmGrouping: palmGrouping ?? '' };
        return getPool().transaction(async (tx) => {
          return await projectUpsert(project, ctx.user, true);
        });
      })
  });
};
