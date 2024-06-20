import { z } from 'zod';

import { codeId } from './code';
import { isoDateString, nonEmptyString } from './common';
import { mapSearchSchema, periodSchema } from './project';
import { dbProjectSchema } from './project/base';

export const projectObjectUserRoleSchema = z.object({
  roleId: codeId,
  userIds: z.array(nonEmptyString),
  companyContactIds: z.array(nonEmptyString),
});

export const updateBudgetSchema = z.object({
  projectObjectId: z.string().optional(),
  budgetItems: z.array(
    z.object({
      year: z.number(),
      amount: z.number().nullable(),
      forecast: z.number().nullable(),
      kayttosuunnitelmanMuutos: z.number().nullable(),
    }),
  ),
});

export const newProjectObjectSchema = z.object({
  // id here as well since zodResolver in the form hook does not send the id if not in this schema
  projectObjectId: z.string().optional().nullable(),
  projectId: z.string(),
  objectName: nonEmptyString,
  description: nonEmptyString,
  objectStage: codeId,
  lifecycleState: codeId,
  objectType: z.array(codeId).superRefine((value) => value.length > 0),
  objectCategory: z.array(codeId).superRefine((value) => value.length > 0),
  objectUsage: z.array(codeId).superRefine((value) => value.length > 0),
  suunnitteluttajaUser: nonEmptyString.optional().nullable(),
  rakennuttajaUser: nonEmptyString.optional().nullable(),
  startDate: isoDateString,
  endDate: isoDateString,
  sapWBSId: nonEmptyString.optional().nullable(),
  landownership: codeId.optional().nullable(),
  locationOnProperty: codeId.optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  objectUserRoles: z.array(projectObjectUserRoleSchema),
  budgetUpdate: updateBudgetSchema.optional().nullable(),
  geom: z.string().optional().nullable(),
});

export const updateProjectObjectSchema = newProjectObjectSchema.partial().extend({
  projectObjectId: z.string(),
});

export type NewProjectObject = z.infer<typeof newProjectObjectSchema>;
export type UpdateProjectObject = z.infer<typeof updateProjectObjectSchema>;

export const dbProjectObjectSchema = newProjectObjectSchema.extend({
  projectObjectId: z.string(),
  geom: z.string().nullable(),
  geometryDump: z.array(z.string()).nullish(),
  createdAt: isoDateString,
  deleted: z.boolean(),
  updatedBy: z.string(),
  permissionCtx: z.object({
    writeUsers: z.array(nonEmptyString),
    owner: nonEmptyString,
  }),
});

export const dbProjectObjectGeometrySchema = dbProjectObjectSchema.pick({
  geom: true,
  projectObjectId: true,
  objectName: true,
});

export const projectObjectSearchSchema = z.object({
  limit: z.number().int().optional(),
  projectObjectName: z.string().optional(),
  projectName: z.string().optional(),
  dateRange: periodSchema.optional(),
  map: mapSearchSchema.optional(),
  objectParticipantUser: nonEmptyString.nullish(),
  objectTypes: dbProjectObjectSchema.shape.objectType.optional(),
  objectCategories: dbProjectObjectSchema.shape.objectCategory.optional(),
  objectUsages: dbProjectObjectSchema.shape.objectUsage.optional(),
  lifecycleStates: z.array(dbProjectObjectSchema.shape.lifecycleState).optional(),
  objectStages: z.array(dbProjectObjectSchema.shape.objectStage).optional(),
  includeWithoutGeom: z.boolean().optional(),
  rakennuttajaUsers: z.array(nonEmptyString).optional(),
  suunnitteluttajaUsers: z.array(nonEmptyString).optional(),
});

export const objectsByProjectSearchSchema = z.object({
  projectIds: z.array(z.string()),
  map: mapSearchSchema.optional(),
});

export const projectObjectSearchResultSchema = z.object({
  projectObjects: z.array(
    dbProjectObjectSchema
      .pick({
        projectObjectId: true,
        objectName: true,
        startDate: true,
        endDate: true,
        geom: true,
        objectStage: true,
      })
      .extend({
        project: dbProjectSchema
          .pick({
            endDate: true,
            projectId: true,
            startDate: true,
            projectName: true,
            projectType: true,
            detailplanId: true,
          })
          .extend({ geom: z.string().nullish() }),
      }),
  ),
  clusters: z.array(
    z.object({
      clusterProjectObjectIds: z.array(z.string()),
      clusterCount: z.number(),
      clusterLocation: z.string(),
      clusterGeohash: z.string(),
    }),
  ),
});

export const upsertProjectObjectSchema = z.union([
  newProjectObjectSchema,
  updateProjectObjectSchema,
]);

export type UpsertProjectObject = z.infer<typeof upsertProjectObjectSchema>;

export type DBProjectObject = z.infer<typeof dbProjectObjectSchema>;

export const getProjectObjectParams = z.object({
  projectId: z.string(),
  projectObjectId: z.string(),
});

export type ProjectObjectParams = z.infer<typeof getProjectObjectParams>;

export const updateGeometrySchema = z.object({
  projectObjectId: z.string(),
  features: z.string(),
});
export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;

export const updateGeometryResultSchema = z.object({
  projectObjectId: z.string(),
  geom: z.string(),
});

export const deleteProjectObjectSchema = z.object({
  projectObjectId: z.string(),
});

export type UpdateGeometryResult = z.infer<typeof updateGeometryResultSchema>;

export const yearBudgetSchema = z.object({
  year: z.number(),
  budgetItems: z.object({
    amount: z.number().nullable(),
    forecast: z.number().nullable(),
    kayttosuunnitelmanMuutos: z.number().nullable(),
  }),
});

export type YearBudget = z.infer<typeof yearBudgetSchema>;

export type BudgetUpdate = z.infer<typeof updateBudgetSchema>;

export type ProjectObjectUserRole = z.infer<typeof projectObjectUserRoleSchema>;

export type ProjectObjectSearch = z.infer<typeof projectObjectSearchSchema>;
export type ObjectsByProjectSearch = z.infer<typeof objectsByProjectSearchSchema>;
export type ProjectObjectSearchResult = z.infer<typeof projectObjectSearchResultSchema>;
