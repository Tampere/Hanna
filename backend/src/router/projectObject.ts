import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getPermissionContext as getProjectPermissionCtx } from '@backend/components/project/base';
import {
  deleteProjectObject,
  getGeometriesByProjectId,
  getPermissionContext,
  getProjectObject,
  getProjectObjectBudget,
  getProjectObjectsByProjectId,
  projectObjectSearch,
  updateProjectObjectBudget,
  updateProjectObjectGeometry,
  upsertProjectObject,
  validateUpsertProjectObject,
} from '@backend/components/projectObject';
import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import { nonEmptyString } from '@shared/schema/common';
import {
  deleteProjectObjectSchema,
  getProjectObjectParams,
  projectObjectSearchSchema,
  updateBudgetSchema,
  updateGeometrySchema,
  upsertProjectObjectSchema,
} from '@shared/schema/projectObject';
import {
  ProjectAccessChecker,
  hasPermission,
  hasWritePermission,
  isProjectObjectIdInput,
  ownsProject,
} from '@shared/schema/userPermissions';

/**
 * This function creates a middleware to check if a user has access to a project.
 * It takes two parameters: a TRPC instance and a function to check if a user has access to a project.
 * The function 'canAccess' should take a user and a permission context as parameters and return a boolean.
 * The middleware function returned by this function will throw a TRPCError with a 'BAD_REQUEST' code
 * if the input is not a project ID or if the user does not have access to the project.
 * If the user has access to the project, the middleware function will call the next middleware in the stack.
 *
 * @param {TRPC} t - The TRPC instance used to create the middleware.
 * @param {ProjectAccessChecker} canAccess - A function that checks if a user has access to a project.
 * @returns {Function} A middleware function that checks if a user has access to a project.
 */

const createAccessMiddleware = (t: TRPC) => (canAccess: ProjectAccessChecker) =>
  t.middleware(async (opts) => {
    const { ctx, input, next } = opts;
    if (!isProjectObjectIdInput(input)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.invalidInput',
      });
    }
    const permissionCtx = await getPermissionContext(input.projectObjectId);
    if (!canAccess(ctx.user, permissionCtx)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.insufficientPermissions',
      });
    }
    return next();
  });

export const createProjectObjectRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    get: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      return await getPool().transaction(async (tx) => {
        const projectObject = await getProjectObject(tx, input.projectObjectId);
        const permissionCtx = await getPermissionContext(input.projectObjectId, tx);
        return { ...projectObject, acl: permissionCtx };
      });
    }),

    search: t.procedure.input(projectObjectSearchSchema).query(async ({ input }) => {
      return await projectObjectSearch(input);
    }),

    getBudget: t.procedure
      .input(z.object({ projectObjectId: z.string() }))
      .query(async ({ input }) => {
        return await getProjectObjectBudget(input.projectObjectId);
      }),

    getByProjectId: t.procedure
      .input(z.object({ projectId: nonEmptyString }))
      .query(async ({ input }) => {
        return getProjectObjectsByProjectId(input.projectId);
      }),

    getGeometriesByProjectId: t.procedure
      .input(z.object({ projectId: nonEmptyString }))
      .query(async ({ input }) => {
        return getGeometriesByProjectId(input.projectId);
      }),

    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return await getPool().connect(async (conn) => {
        return await validateUpsertProjectObject(conn, input);
      });
    }),

    // Mutations requiring write permissions / project ownership

    upsert: t.procedure.input(upsertProjectObjectSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        let permissionCtx;
        if (!input.projectObjectId && input.projectId) {
          permissionCtx = await getProjectPermissionCtx(input.projectId);
        } else if (input.projectObjectId) {
          permissionCtx = await getPermissionContext(input.projectObjectId);
        } else {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.invalidInput' });
        }

        if (!hasWritePermission(ctx.user, permissionCtx) && !ownsProject(ctx.user, permissionCtx)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        } else {
          return await upsertProjectObject(tx, input, ctx.user.id);
        }
      });
    }),

    updateGeometry: t.procedure
      .input(updateGeometrySchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectObjectGeometry(tx, input, ctx.user.id);
        });
      }),

    updateBudget: t.procedure
      .input(updateBudgetSchema.required())
      .use(
        withAccess(
          (usr, ctx) =>
            ownsProject(usr, ctx) ||
            hasWritePermission(usr, ctx) ||
            hasPermission(usr, 'financials.write'),
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

    delete: t.procedure
      .input(deleteProjectObjectSchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        const { projectObjectId } = input;
        return await deleteProjectObject(projectObjectId, ctx.user);
      }),
  });
};
