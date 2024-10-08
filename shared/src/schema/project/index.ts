import { z } from 'zod';

import { codeId } from '../code.js';
import { isoDateString } from '../common.js';
import { dbProjectSchema } from './base.js';
import { ProjectType, projectTypeSchema } from './type.js';

export const periodSchema = z.object({
  startDate: isoDateString.nullable(),
  endDate: isoDateString.nullable(),
});

export type Period = z.infer<typeof periodSchema>;

export const projectListParamsSchema = z.object({
  projectType: projectTypeSchema.optional(),
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
        targets: z.array(z.string()).optional(),
      })
      .optional(),
    maintenanceProject: z
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
  withProjectObjects: z.boolean().optional(),
  onlyCoversMunicipality: z.boolean(),
});

const projectObjectSearchParentProject = dbProjectSchema
  .pick({
    projectId: true,
    startDate: true,
    projectName: true,
    projectType: true,
    coversMunicipality: true,
  })
  .extend({
    geom: z.string().nullish(),
    endDate: dbProjectSchema.shape.endDate.or(z.literal('infinity')),
  });

export const projectSearchResultSchema = z.object({
  projects: z.array(
    projectObjectSearchParentProject.merge(
      dbProjectSchema.pick({ detailplanId: true, coversMunicipality: true }),
    ),
  ),
  clusters: z.array(
    z.object({
      clusterProjectIds: z.array(z.string()),
      clusterIndex: z.number(),
      clusterCount: z.number(),
      clusterLocation: z.string(),
      clusterGeohash: z.string(),
      projectDistribution: z.record(projectTypeSchema, z.number()),
    }),
  ),
  projectTotalCount: z.number(),
});

export type ProjectObjectSearchParentProject = z.infer<typeof projectObjectSearchParentProject>;

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
  projectType: projectTypeSchema,
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
    estimate: z.number().nullish(),
    contractPrice: z.number().nullish(),
    amount: z.number().nullish(),
    forecast: z.number().nullish(),
    kayttosuunnitelmanMuutos: z.number().nullish(),
  }),
});

export type ProjectYearBudget = z.infer<typeof yearBudgetSchema>;

export const budgetUpdateSchema = z.object({
  projectId: z.string(),
  budgetItems: z.array(
    z
      .object({
        year: z.number(),
        estimate: z.number().nullable(),
      })
      .strict(),
  ),
});

export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;
