import { TRPCError } from '@trpc/server';
import { hasWritePermission, ownsProject } from 'tre-hanna-shared/src/schema/userPermissions.js';
import { z } from 'zod';

import { getPermissionContext as getProjectPermissionCtx } from '@backend/components/project/base.js';
import { getPermissionContext } from '@backend/components/projectObject/index.js';
import {
  getProjectObject,
  upsertProjectObject,
} from '@backend/components/projectObject/maintenance.js';
import { getPool } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';

import { getProjectObjectParams } from '@shared/schema/projectObject/base.js';

export const createMaintenanceProjectObjectRouter = (t: TRPC) => {
  return t.router({
    get: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      return await getPool().transaction(async (tx) => {
        const projectObject = await getProjectObject(tx, input.projectObjectId);
        const permissionCtx = await getPermissionContext(input.projectObjectId, tx);
        return { ...projectObject, acl: permissionCtx };
      });
    }),
    upsert: t.procedure.input(z.any()).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        let permissionCtx;
        if (!input.projectObjectId && input.projectId) {
          permissionCtx = await getProjectPermissionCtx(input.projectId, tx);
        } else if (input.projectObjectId) {
          permissionCtx = await getPermissionContext(input.projectObjectId, tx);
        } else {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.invalidInput' });
        }

        if (!hasWritePermission(ctx.user, permissionCtx) && !ownsProject(ctx.user, permissionCtx)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        }
        return upsertProjectObject(tx, input, ctx.user.id);
      });
    }),
  });
};
