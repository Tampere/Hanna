import { TRPCError } from '@trpc/server';

import { getPermissionContext as getProjectPermissionCtx } from '@backend/components/project/base.js';
import {
  getPermissionContext,
  updateProjectObjectBudget,
} from '@backend/components/projectObject/index.js';
import {
  getProjectObject,
  upsertProjectObject,
} from '@backend/components/projectObject/investment.js';
import { getPool } from '@backend/db.js';
import { createAccessMiddleware } from '@backend/router/projectObject/base.js';

import { getProjectObjectParams, updateBudgetSchema } from '@shared/schema/projectObject/base.js';
import { upsertInvestmentProjectObjectSchema } from '@shared/schema/projectObject/investment.js';
import { hasPermission, hasWritePermission, ownsProject } from '@shared/schema/userPermissions.js';

import { TRPC } from '../index.js';

export const createInvestmentProjectObjectRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);
  return t.router({
    get: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      return await getPool().transaction(async (tx) => {
        const projectObject = await getProjectObject(tx, input.projectObjectId);
        const permissionCtx = await getPermissionContext(input.projectObjectId, tx);
        return { ...projectObject, acl: permissionCtx };
      });
    }),

    // Mutations requiring write permissions / project ownership
    upsert: t.procedure
      .input(upsertInvestmentProjectObjectSchema)
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          let permissionCtx;
          if (!input.projectObjectId && input.projectId) {
            permissionCtx = await getProjectPermissionCtx(input.projectId, tx);
          } else if (input.projectObjectId) {
            permissionCtx = await getPermissionContext(input.projectObjectId, tx);
          } else {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.invalidInput' });
          }

          if (
            !hasWritePermission(ctx.user, permissionCtx) &&
            !ownsProject(ctx.user, permissionCtx)
          ) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
          }
          return upsertProjectObject(tx, input, ctx.user.id);
        });
      }),
    updateBudget: t.procedure
      .input(updateBudgetSchema.required())
      .use(
        withAccess(
          (usr, ctx) =>
            ownsProject(usr, ctx) ||
            hasWritePermission(usr, ctx) ||
            hasPermission(usr, 'investmentFinancials.write'),
        ),
      )
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectObjectBudget(
            tx,
            input.projectObjectId,
            input.budgetItems,
            ctx.user.id,
          );
        });
      }),
  });
};
