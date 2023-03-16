import { z } from 'zod';

import { isoDateString } from '../common';

export const periodSchema = z.object({
  startDate: isoDateString,
  endDate: isoDateString,
});

export type Period = z.infer<typeof periodSchema>;

export const mapSearchSchema = z.object({
  zoom: z.number(),
  extent: z.array(z.number()),
});

export type MapSearch = z.infer<typeof mapSearchSchema>;

export const projectSearchSchema = z.object({
  limit: z.number().int().optional(),
  text: z.string().optional(),
  dateRange: periodSchema.optional(),
  lifecycleStates: z.array(z.string()).optional(),
  projectTypes: z.array(z.string()).optional(),
  map: mapSearchSchema.optional(),
  includeWithoutGeom: z.boolean().optional(),
});

export const projectSearchResultSchema = z.object({
  // !FIXME: search specific schema
  projects: z.array(z.any()),
  clusters: z.array(
    z.object({
      clusterCount: z.number(),
      clusterLocation: z.string(),
      clusterGeohash: z.string(),
    })
  ),
});

export type ProjectSearchResult = z.infer<typeof projectSearchResultSchema>;

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

export type Relation = 'parent' | 'child' | 'related';

export interface ProjectRelation {
  projectId: string;
  projectName: string;
  relation: Relation;
}

export const updateGeometrySchema = z.object({
  id: z.string(),
  features: z.string(),
});

export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;

export const updateGeometryResultSchema = z.object({
  id: z.string(),
  geom: z.string(),
});

export type UpdateGeometryResult = z.infer<typeof updateGeometryResultSchema>;

const projectRelationSchema = z.object({
  relation: z.enum(['parent', 'child', 'related']),
  projectId: z.string(),
  projectName: z.string(),
});

export const projectRelationsSchema = z.object({
  relations: z.object({
    parents: z.array(projectRelationSchema).nullable(),
    children: z.array(projectRelationSchema).nullable(),
    related: z.array(projectRelationSchema).nullable(),
  }),
});

export const relationsSchema = z.object({
  subjectProjectId: z.string(),
  objectProjectId: z.string(),
  relation: z.enum(['parent', 'child', 'related']),
});

export const costEstimateSchema = z.object({
  year: z.number(),
  estimates: z.array(
    z.object({
      id: z.string().optional(),
      amount: z.number().nullable(),
    })
  ),
});

export type CostEstimate = z.infer<typeof costEstimateSchema>;

export const getCostEstimatesInputSchema = z.union([
  z.object({
    projectId: z.string(),
    projectObjectId: z.undefined().optional(),
    taskId: z.undefined().optional(),
  }),
  z.object({
    projectId: z.undefined().optional(),
    projectObjectId: z.string(),
    taskId: z.undefined().optional(),
  }),
  z.object({
    projectId: z.undefined().optional(),
    projectObjectId: z.undefined().optional(),
    taskId: z.string(),
  }),
]);

export type CostEstimatesInput = z.infer<typeof getCostEstimatesInputSchema>;

export const updateCostEstimatesInputSchema = z.intersection(
  getCostEstimatesInputSchema,
  z.object({ costEstimates: z.array(costEstimateSchema) })
);

export type CostEstimatesUpdate = z.infer<typeof updateCostEstimatesInputSchema>;
