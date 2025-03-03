import { z } from 'zod';

import { nonEmptyString } from '../common.js';
import { dbProjectSchema } from '../project/base.js';
import { mapSearchSchema, periodSchema } from '../project/index.js';
import { mergedProjectObjectDbSchema } from './index.js';

export const projectObjectSearchSchema = z.object({
  limit: z.number().int().optional(),
  projectObjectName: z.string().optional(),
  projectName: z.string().optional(),
  projectId: z.string().optional(),
  dateRange: periodSchema.optional(),
  map: mapSearchSchema.optional(),
  objectParticipantUser: nonEmptyString.nullish(),
  objectTypes: z.array(mergedProjectObjectDbSchema.shape.objectType).optional(),
  objectCategories: mergedProjectObjectDbSchema.shape.objectCategory.optional(),
  objectUsages: mergedProjectObjectDbSchema.shape.objectUsage.optional(),
  lifecycleStates: z.array(mergedProjectObjectDbSchema.shape.lifecycleState).optional(),
  objectStages: z.array(mergedProjectObjectDbSchema.shape.objectStage).optional(),
  includeWithoutGeom: z.boolean().optional(),
  rakennuttajaUsers: z.array(nonEmptyString).optional(),
  suunnitteluttajaUsers: z.array(nonEmptyString).optional(),
});

export const objectsByProjectSearchSchema = z.object({
  projectIds: z.array(z.string()),
  map: mapSearchSchema.optional(),
});

export const projectObjectSearchResultSchema = z.object({
  totalCount: z.number(),
  projectObjects: z.array(
    mergedProjectObjectDbSchema
      .pick({
        projectObjectId: true,
        objectName: true,
        startDate: true,
        geom: true,
      })
      .extend({
        endDate: mergedProjectObjectDbSchema.shape.endDate.or(z.literal('infinity')),
        objectStage: mergedProjectObjectDbSchema.shape.objectStage.nullish(),
        objectCategory: mergedProjectObjectDbSchema.shape.objectCategory.nullish(),
        project: dbProjectSchema
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
          }),
      }),
  ),
  clusters: z.array(
    z.object({
      clusterProjectObjectIds: z.array(z.string()),
      clusterCount: z.number(),
      clusterLocation: z.string(),
      clusterGeohash: z.string(),
      clusterIndex: z.number(),
    }),
  ),
});

export type ProjectObjectSearch = z.infer<typeof projectObjectSearchSchema>;
export type ObjectsByProjectSearch = z.infer<typeof objectsByProjectSearchSchema>;
export type ProjectObjectSearchResult = z.infer<typeof projectObjectSearchResultSchema>;
