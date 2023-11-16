import { z } from 'zod';

import {
  addProjectRelation,
  getProjectBudget,
  getRelatedProjects,
  removeProjectRelation,
  updateProjectBudget,
  updateProjectGeometry,
} from '@backend/components/project';
import { deleteProject, getProject } from '@backend/components/project/base';
import { listProjects, projectSearch } from '@backend/components/project/search';
import { startReportJob } from '@backend/components/taskQueue/reportQueue';
import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  budgetUpdateSchema,
  projectListParamsSchema,
  projectSearchSchema,
  relationsSchema,
  updateGeometrySchema,
} from '@shared/schema/project';
import { projectIdSchema } from '@shared/schema/project/base';

export const createProjectRouter = (t: TRPC) =>
  t.router({
    list: t.procedure.input(projectListParamsSchema).query(async ({ input }) => {
      return listProjects(input);
    }),

    search: t.procedure.input(projectSearchSchema).query(async ({ input }) => {
      return projectSearch(input);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),

    getRelations: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getRelatedProjects(id);
    }),

    // XXX: only owner can delete
    delete: t.procedure.input(projectIdSchema).mutation(async ({ input, ctx }) => {
      const { id } = input;
      return deleteProject(id, ctx.user.id);
    }),

    // XXX: only owner and those with given write permissions can update
    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        return updateProjectGeometry(tx, input, ctx.user);
      });
    }),

    getBudget: t.procedure.input(z.object({ projectId: z.string() })).query(async ({ input }) => {
      return getProjectBudget(input.projectId);
    }),

    updateBudget: t.procedure.input(budgetUpdateSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        return await updateProjectBudget(tx, input.projectId, input.budgetItems, ctx.user.id);
      });
    }),

    // XXX: only owner and those with given write permissions can update
    updateRelations: t.procedure.input(relationsSchema).mutation(async ({ input, ctx }) => {
      const { subjectProjectId, objectProjectId, relation } = input;
      return await addProjectRelation(subjectProjectId, objectProjectId, relation, ctx.user);
    }),

    // XXX: only owner and those with given write permissions can update
    removeRelation: t.procedure.input(relationsSchema).mutation(async ({ input, ctx }) => {
      const { subjectProjectId: projectId, objectProjectId: targetProjectId, relation } = input;
      return await removeProjectRelation(projectId, targetProjectId, relation, ctx.user);
    }),

    startReportJob: t.procedure.input(projectSearchSchema).query(async ({ input }) => {
      return await startReportJob(input);
    }),

    // XXX: implement
    getPermissions: t.procedure.query(async () => {
      return [];
    }),

    // XXX: implement
    updatePermissions: t.procedure.mutation(async () => {
      return [];
    }),

    // XXX: only owner can change owner
    changeOwner: t.procedure.mutation(async () => {
      return [];
    }),
  });
