import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  addProjectRelation,
  getProjectBudget,
  getRelatedProjects,
  removeProjectRelation,
  updateProjectBudget,
  updateProjectGeometry,
} from '@backend/components/project';
import {
  deleteProject,
  getPermissionContext,
  getProject,
  getProjectUserPermissions,
  projectPermissionUpsert,
} from '@backend/components/project/base';
import { listProjects, projectSearch } from '@backend/components/project/search';
import { getProjectObjectsByProjectSearch } from '@backend/components/projectObject';
import { startReportJob } from '@backend/components/taskQueue/reportQueue';
import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  budgetUpdateSchema,
  projectListParamsSchema,
  projectSearchResultSchema,
  projectSearchSchema,
  relationsSchema,
  updateGeometrySchema,
} from '@shared/schema/project';
import { projectIdSchema, projectPermissionSchema } from '@shared/schema/project/base';
import { projectObjectSearchResultSchema } from '@shared/schema/projectObject';
import {
  ProjectAccessChecker,
  hasPermission,
  hasWritePermission,
  isProjectIdInput,
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

export const createAccessMiddleware = (t: TRPC) => (canAccess: ProjectAccessChecker) =>
  t.middleware(async (opts) => {
    const { ctx, input, next } = opts;
    if (!isProjectIdInput(input)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.invalidInput',
      });
    }
    const permissionCtx = await getPermissionContext(input.projectId);
    if (!canAccess(ctx.user, permissionCtx)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.insufficientPermissions',
      });
    }
    return next();
  });

export const createProjectRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    // read-only routes available to all users
    list: t.procedure.input(projectListParamsSchema).query(async ({ input }) => {
      return listProjects(input);
    }),

    search: t.procedure
      .input(projectSearchSchema)
      .output(
        z.object({
          projects: projectSearchResultSchema.shape.projects,
          clusters: projectSearchResultSchema.shape.clusters,
          projectObjects: projectObjectSearchResultSchema.shape.projectObjects.optional(),
        }),
      )
      .query(async ({ input }) => {
        const { withProjectObjects, ...restSearchParams } = input;
        if (withProjectObjects) {
          return await getPool().transaction(async (tx) => {
            const projects = await projectSearch(restSearchParams, tx);
            if (projects.projects.length === 0) return projects;

            const projectIds = projects.projects.map((project) => project.projectId);
            const projectObjects = await getProjectObjectsByProjectSearch(
              { projectIds, map: input.map },
              tx,
            );

            if (!projectObjects) return projects;
            return { ...projects, projectObjects };
          });
        }
        const projects = await projectSearch(restSearchParams);

        return projects;
      }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { projectId } = input;
      return getProject(projectId);
    }),

    getRelations: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { projectId: id } = input;
      return getRelatedProjects(id);
    }),

    getBudget: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      return getProjectBudget(input.projectId);
    }),

    startReportJob: t.procedure.input(projectSearchSchema).query(async ({ input }) => {
      return await startReportJob(input);
    }),

    // Protected routes requiring extra permissions
    delete: t.procedure
      .input(projectIdSchema)
      .use(withAccess(ownsProject))
      .mutation(async ({ input, ctx }) => {
        const { projectId: id } = input;
        return deleteProject(id, ctx.user.id);
      }),

    updateGeometry: t.procedure
      .input(updateGeometrySchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectGeometry(tx, input, ctx.user);
        });
      }),

    updateBudget: t.procedure
      .input(budgetUpdateSchema)
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
          return await updateProjectBudget(tx, input.projectId, input.budgetItems, ctx.user.id);
        });
      }),

    updateRelations: t.procedure.input(relationsSchema).mutation(async ({ input, ctx }) => {
      const subjectProjectPermissionCtx = await getPermissionContext(input.subjectProjectId);
      const objectProjectPermissionCtx = await getPermissionContext(input.objectProjectId);
      if (
        hasWritePermission(ctx.user, subjectProjectPermissionCtx) ||
        hasWritePermission(ctx.user, objectProjectPermissionCtx) ||
        ownsProject(ctx.user, subjectProjectPermissionCtx) ||
        ownsProject(ctx.user, objectProjectPermissionCtx)
      ) {
        const { subjectProjectId, objectProjectId, relation } = input;
        return await addProjectRelation(subjectProjectId, objectProjectId, relation, ctx.user);
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'error.insufficientPermissions',
        });
      }
    }),

    removeRelation: t.procedure.input(relationsSchema).mutation(async ({ input, ctx }) => {
      const { subjectProjectId: projectId, objectProjectId: targetProjectId, relation } = input;
      const subjectProjectPermissionCtx = await getPermissionContext(projectId);
      const objectProjectPermissionCtx = await getPermissionContext(targetProjectId);
      if (
        hasWritePermission(ctx.user, subjectProjectPermissionCtx) ||
        hasWritePermission(ctx.user, objectProjectPermissionCtx) ||
        ownsProject(ctx.user, subjectProjectPermissionCtx) ||
        ownsProject(ctx.user, objectProjectPermissionCtx)
      ) {
        return await removeProjectRelation(projectId, targetProjectId, relation, ctx.user);
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'error.insufficientPermissions',
        });
      }
    }),

    getPermissions: t.procedure
      .input(z.object({ projectId: z.string(), withAdmins: z.boolean().optional() }))
      .use(withAccess((user, ctx) => ownsProject(user, ctx) || hasWritePermission(user, ctx)))
      .query(async ({ input }) => {
        return await getProjectUserPermissions(input.projectId, input.withAdmins);
      }),

    updatePermissions: t.procedure
      .input(projectPermissionSchema)
      .use(withAccess(ownsProject))
      .mutation(async ({ input }) => {
        return await projectPermissionUpsert(input);
      }),
  });
};
