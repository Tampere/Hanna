import { z } from 'zod';

import { codeId } from './code';
import { isoDateString, nonEmptyString } from './common';

export const upsertProjectObjectSchema = z.object({
  id: z.string().optional(),
  projectId: z.string(),
  objectName: nonEmptyString,
  description: nonEmptyString,
  lifecycleState: codeId,
  objectType: z.array(codeId).superRefine((value) => value.length > 0),
  objectCategory: z.array(codeId).superRefine((value) => value.length > 0),
  objectUsage: z.array(codeId).superRefine((value) => value.length > 0),
  personInCharge: nonEmptyString,
  startDate: isoDateString,
  endDate: isoDateString,
  sapWBSId: nonEmptyString.optional().nullable(),
  landownership: codeId.optional().nullable(),
  locationOnProperty: codeId.optional().nullable(),
  height: z.coerce.number().optional().nullable(),
});

export const dbProjectObjectSchema = upsertProjectObjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
  createdAt: isoDateString,
  deleted: z.boolean(),
  updatedBy: z.string(),
});

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
