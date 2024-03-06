import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString } from '../common';
import { dbProjectSchema } from './base';
import { ProjectType } from './type';

export const periodSchema = z.object({
  startDate: isoDateString.nullable(),
  endDate: isoDateString.nullable(),
});

export type Period = z.infer<typeof periodSchema>;

export const projectListParamsSchema = z.object({
  projectType: z.enum(['investmentProject', 'detailplanProject']).optional(),
});

export type ProjectListParams = z.infer<typeof projectListParamsSchema>;

export const projectListItemSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
});

export type ProjectListItem = z.infer<typeof projectListItemSchema>;

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
  owners: z.array(z.string()).optional(),
  includeWithoutGeom: z.boolean().optional(),
  filters: z.object({
    investmentProject: z
      .object({
        committees: z.array(z.string()).optional(),
      })
      .optional(),
    detailplanProject: z
      .object({
        preparers: z.array(z.string()).optional(),
        planningZones: z.array(z.string()).optional(),
        subtypes: z.array(codeId).optional(),
      })
      .optional(),
  }),
});

export const projectSearchResultSchema = z.object({
  projects: z.array(dbProjectSchema),
  clusters: z.array(
    z.object({
      clusterCount: z.number(),
      clusterLocation: z.string(),
      clusterGeohash: z.string(),
    }),
  ),
});

export type ProjectSearchResult = z.infer<typeof projectSearchResultSchema>;

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

export type Relation = 'parent' | 'child' | 'related';

export interface ProjectRelation {
  projectId: string;
  projectName: string;
  relation: Relation;
  projectType: ProjectType;
}

export const updateGeometrySchema = z.object({
  projectId: z.string(),
  features: z.string(),
});

export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;

export const updateGeometryResultSchema = z.object({
  projectId: z.string(),
  geom: z.string(),
});

export type UpdateGeometryResult = z.infer<typeof updateGeometryResultSchema>;

const projectRelationSchema = z.object({
  relation: z.enum(['parent', 'child', 'related']),
  projectId: z.string(),
  projectName: z.string(),
  projectType: z.enum(['investmentProject', 'detailplanProject']),
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

export const yearBudgetSchema = z.object({
  year: z.number(),
  budgetItems: z.object({
    amount: z.number().nullable(),
    forecast: z.number().nullable().optional(),
    kayttosuunnitelmanMuutos: z.number().nullable().optional(),
  }),
});

export type YearBudget = z.infer<typeof yearBudgetSchema>;

export const budgetUpdateSchema = z.object({
  projectId: z.string(),
  budgetItems: z.array(
    z.object({
      year: z.number(),
      amount: z.number().nullable(),
    }),
  ),
});

export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;
