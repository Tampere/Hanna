import { z } from 'zod';

import {
  addProjectRelation,
  getCostEstimates,
  getRelatedProjects,
  projectSearch,
  removeProjectRelation,
  updateCostEstimates,
  updateProjectGeometry,
} from '@backend/components/project';
import { deleteProject, getProject } from '@backend/components/project/base';
import { getJob } from '@backend/components/taskQueue';
import { startReportJob } from '@backend/components/taskQueue/reportQueue';
import { TRPC } from '@backend/router';

import {
  getCostEstimatesInputSchema,
  projectSearchSchema,
  relationsSchema,
  updateCostEstimatesInputSchema,
  updateGeometrySchema,
} from '@shared/schema/project';
import { projectIdSchema } from '@shared/schema/project/base';

export const createProjectRouter = (t: TRPC) =>
  t.router({
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

    delete: t.procedure.input(projectIdSchema).mutation(async ({ input, ctx }) => {
      const { id } = input;
      return deleteProject(id, ctx.user.id);
    }),

    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input, ctx }) => {
      return updateProjectGeometry(input, ctx.user);
    }),

    getCostEstimates: t.procedure.input(getCostEstimatesInputSchema).query(async ({ input }) => {
      return getCostEstimates(input);
    }),

    updateCostEstimates: t.procedure
      .input(updateCostEstimatesInputSchema)
      .mutation(async ({ input, ctx }) => {
        return updateCostEstimates(input, ctx.user);
      }),

    updateRelations: t.procedure.input(relationsSchema).mutation(async ({ input, ctx }) => {
      const { subjectProjectId, objectProjectId, relation } = input;
      return await addProjectRelation(subjectProjectId, objectProjectId, relation, ctx.user);
    }),

    removeRelation: t.procedure.input(relationsSchema).mutation(async ({ input, ctx }) => {
      const { subjectProjectId: projectId, objectProjectId: targetProjectId, relation } = input;
      return await removeProjectRelation(projectId, targetProjectId, relation, ctx.user);
    }),

    startReportJob: t.procedure.input(projectSearchSchema).query(async ({ input }) => {
      return await startReportJob(input);
    }),

    getReportJobStatus: t.procedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const { state, isFinished } = await getJob(input.jobId);
        return { state, isFinished };
      }),

    getReportJobOutput: t.procedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const { output } = await getJob(input.jobId);
        return output;
      }),
  });