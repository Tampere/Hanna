import { z } from 'zod';

import { isoDateStringRegex } from '../utils';

export const upsertProjectSchema = z.object({
  id: z.string().optional(),
  projectName: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().regex(isoDateStringRegex),
  endDate: z.string().regex(isoDateStringRegex),
  lifecycleState: z.enum(['01', '02', '03', '04']),
});

export type UpsertProject = z.infer<typeof upsertProjectSchema>;

export const periodSchema = z.object({
  startDate: z.string().regex(isoDateStringRegex),
  endDate: z.string().regex(isoDateStringRegex),
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
  financingTypes: z.array(z.string()).optional(),
  map: mapSearchSchema.optional(),
});

export const dbProjectSchema = upsertProjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
});

export const projectSearchResultSchema = z.object({
  projects: z.array(dbProjectSchema),
  clusters: z.array(
    z.object({
      clusterCount: z.number(),
      clusterLocation: z.string(),
      clusterGeohash: z.string(),
    })
  ),
});

export type ProjectSearchResult = z.infer<typeof projectSearchResultSchema>;

export const projectIdSchema = z.object({
  id: z.string(),
});

export type DbProject = z.infer<typeof dbProjectSchema>;

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
  estimates: z.array(z.object({
    id: z.string().optional(),
    amount: z.number().nullable()
  }))
})

export type CostEstimate = z.infer<typeof costEstimateSchema>

export const updateCostEstimatesSchema = z.object({
  projectId: z.string(),
  costEstimates: z.array(costEstimateSchema)
})
