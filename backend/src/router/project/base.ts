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
import { getReportJob, startReportJob } from '@backend/components/taskQueue/reportQueue';
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

    delete: t.procedure.input(projectIdSchema).mutation(async ({ input }) => {
      const { id } = input;
      return deleteProject(id);
    }),

    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input }) => {
      return updateProjectGeometry(input);
    }),

    getCostEstimates: t.procedure.input(getCostEstimatesInputSchema).query(async ({ input }) => {
      return getCostEstimates(input);
    }),

    updateCostEstimates: t.procedure
      .input(updateCostEstimatesInputSchema)
      .mutation(async ({ input }) => {
        return updateCostEstimates(input);
      }),

    updateRelations: t.procedure.input(relationsSchema).mutation(async ({ input }) => {
      const { subjectProjectId, objectProjectId, relation } = input;
      return await addProjectRelation(subjectProjectId, objectProjectId, relation);
    }),

    remoteRelation: t.procedure.input(relationsSchema).mutation(async ({ input }) => {
      const { subjectProjectId: projectId, objectProjectId: targetProjectId, relation } = input;
      return await removeProjectRelation(projectId, targetProjectId, relation);
    }),

    startReportJob: t.procedure.input(projectSearchSchema).query(async ({ input }) => {
      return await startReportJob(input);
    }),

    getReportJobStatus: t.procedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const { state, isFinished } = await getReportJob(input.jobId);
        return { state, isFinished };
      }),

    getReportJobOutput: t.procedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const { output } = await getReportJob(input.jobId);
        return output;
      }),
  });
