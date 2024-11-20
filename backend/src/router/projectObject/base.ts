import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  deleteProjectObject,
  getGeometriesByProjectId,
  getPermissionContext,
  getProjectObjectBudget,
  getProjectObjectsByProjectId,
  updateProjectObjectGeometry,
  validateUpsertProjectObject,
} from '@backend/components/projectObject/index.js';
import { projectObjectSearch } from '@backend/components/projectObject/search.js';
import { getPool } from '@backend/db.js';
import { TRPC } from '@backend/router/index.js';

import { nonEmptyString } from '@shared/schema/common.js';
import {
  deleteProjectObjectSchema,
  updateGeometrySchema,
} from '@shared/schema/projectObject/base.js';
import { dbObjectOrderBySchema } from '@shared/schema/projectObject/index.js';
import { projectObjectSearchSchema } from '@shared/schema/projectObject/search.js';
import {
  ProjectAccessChecker,
  hasWritePermission,
  isProjectObjectIdInput,
  ownsProject,
} from '@shared/schema/userPermissions.js';

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

export const createAccessMiddleware = (t: TRPC) => (canAccess: ProjectAccessChecker) =>
  t.middleware(async (opts) => {
    const { ctx, input, next } = opts;
    if (!isProjectObjectIdInput(input)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.invalidInput',
      });
    }
    const permissionCtx = await getPermissionContext(input.projectObjectId);
    if (!canAccess(ctx.user, permissionCtx, input)) {
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
    search: t.procedure.input(projectObjectSearchSchema).query(async ({ input }) => {
      return await projectObjectSearch(input);
    }),

    getBudget: t.procedure
      .input(z.object({ projectObjectId: z.string() }))
      .query(async ({ input }) => {
        return await getProjectObjectBudget(input.projectObjectId);
      }),

    getByProjectId: t.procedure
      .input(z.object({ projectId: nonEmptyString, orderBy: dbObjectOrderBySchema.optional() }))
      .query(async ({ input }) => {
        return getProjectObjectsByProjectId(input.projectId, input.orderBy);
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

    updateGeometry: t.procedure
      .input(updateGeometrySchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectObjectGeometry(tx, input, ctx.user.id);
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
