import { TRPCError } from '@trpc/server';

import { getPermissionContext as getProjectPermissionCtx } from '@backend/components/project/base.js';
import { getPermissionContext } from '@backend/components/projectObject/index.js';
import {
  getProjectObject,
  upsertProjectObject,
} from '@backend/components/projectObject/investment.js';
import { getPool } from '@backend/db.js';

import { getProjectObjectParams } from '@shared/schema/projectObject/base.js';
import { upsertInvestmentProjectObjectSchema } from '@shared/schema/projectObject/investment.js';
import { hasWritePermission, ownsProject } from '@shared/schema/userPermissions.js';

import { TRPC } from '../index.js';

export const createInvestmentProjectObjectRouter = (t: TRPC) => {
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
  });
};
