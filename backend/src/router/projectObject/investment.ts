import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getPermissionContext as getProjectPermissionCtx } from '@backend/components/project/base.js';
import {
  getPermissionContext,
  updateProjectObjectBudget,
} from '@backend/components/projectObject/index.js';
import {
  deleteBudget,
  getProjectObject,
  upsertProjectObject,
} from '@backend/components/projectObject/investment.js';
import { getPool } from '@backend/db.js';
import { createAccessMiddleware } from '@backend/router/projectObject/base.js';

import {
  getProjectObjectParams,
  updateInvestmentBudgetFinancialWriterSchema,
  updateInvestmentBudgetOwnerWriterSchema,
  updateInvestmentBudgetSchema,
} from '@shared/schema/projectObject/base.js';
import { upsertInvestmentProjectObjectSchema } from '@shared/schema/projectObject/investment.js';
import {
  hasPermission,
  hasWritePermission,
  ownsProject,
  userIsAdmin,
} from '@shared/schema/userPermissions.js';

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
      .input(updateInvestmentBudgetSchema.required())
      .use(
        withAccess(
          (usr, ctx, input) =>
            userIsAdmin(usr) ||
            ((ownsProject(usr, ctx) || hasWritePermission(usr, ctx)) &&
              hasPermission(usr, 'investmentFinancials.write')) ||
            ((ownsProject(usr, ctx) || hasWritePermission(usr, ctx)) &&
              Boolean(updateInvestmentBudgetOwnerWriterSchema.safeParse(input).success)) ||
            (hasPermission(usr, 'investmentFinancials.write') &&
              Boolean(updateInvestmentBudgetFinancialWriterSchema.safeParse(input).success)),
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
    deleteBudget: t.procedure
      .input(z.object({ projectObjectId: z.string(), committees: z.array(z.string()) }))
      .use(
        withAccess(
          (usr, ctx, input) =>
            userIsAdmin(usr) ||
            ((ownsProject(usr, ctx) || hasWritePermission(usr, ctx)) &&
              hasPermission(usr, 'investmentFinancials.write')) ||
            ((ownsProject(usr, ctx) || hasWritePermission(usr, ctx)) &&
              Boolean(updateInvestmentBudgetOwnerWriterSchema.safeParse(input).success)) ||
            (hasPermission(usr, 'investmentFinancials.write') &&
              Boolean(updateInvestmentBudgetFinancialWriterSchema.safeParse(input).success)),
        ),
      )
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return deleteBudget(tx, input.projectObjectId, input.committees, ctx.user.id);
        });
      }),
  });
};
