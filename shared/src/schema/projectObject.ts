import { z } from 'zod';

import { codeId } from './code';
import { isoDateString, nonEmptyString } from './common';

export const projectObjectUserRoleSchema = z.object({
  userId: nonEmptyString,
  roleId: codeId,
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
  id: z.string().optional().nullable(),
  projectId: z.string(),
  objectName: nonEmptyString,
  description: nonEmptyString,
  objectStage: codeId,
  lifecycleState: codeId,
  objectType: z.array(codeId).superRefine((value) => value.length > 0),
  objectCategory: z.array(codeId).superRefine((value) => value.length > 0),
  objectUsage: z.array(codeId).superRefine((value) => value.length > 0),
  suunnitteluttajaUser: nonEmptyString.optional(),
  rakennuttajaUser: nonEmptyString.optional(),
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
  id: z.string(),
});

export type NewProjectObject = z.infer<typeof newProjectObjectSchema>;
export type UpdateProjectObject = z.infer<typeof updateProjectObjectSchema>;

export const dbProjectObjectSchema = newProjectObjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
  createdAt: isoDateString,
  deleted: z.boolean(),
  updatedBy: z.string(),
});

export const upsertProjectObjectSchema = z.union([
  newProjectObjectSchema,
  updateProjectObjectSchema,
]);

export type UpsertProjectObject = z.infer<typeof upsertProjectObjectSchema>;

export type DBProjectObject = z.infer<typeof dbProjectObjectSchema>;

export const getProjectObjectParams = z.object({
  projectId: z.string(),
  id: z.string(),
});

export type ProjectObjectParams = z.infer<typeof getProjectObjectParams>;

export const updateGeometrySchema = z.object({
  id: z.string(),
  features: z.string(),
});
export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;

export const updateGeometryResultSchema = z.object({
  id: z.string(),
  geom: z.string(),
});

export const deleteProjectObjectSchema = z.object({
  id: z.string(),
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
