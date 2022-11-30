import { z } from 'zod';

import { isoDateStringRegex } from '../utils';

export const upsertProjectSchema = z.object({
  id: z.string().optional(),
  projectName: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().regex(isoDateStringRegex),
  endDate: z.string().regex(isoDateStringRegex),
});

export type UpsertProject = z.infer<typeof upsertProjectSchema>;

export const periodSchema = z.object({
  startDate: z.string().regex(isoDateStringRegex),
  endDate: z.string().regex(isoDateStringRegex),
});

export type Period = z.infer<typeof periodSchema>;
export const projectSearchSchema = z.object({
  text: z.string(),
  dateRange: periodSchema,
  lifecycleStates: z.array(z.string()),
  projectTypes: z.array(z.string()),
  financingTypes: z.array(z.string()),
});

export const dbProjectSchema = upsertProjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
});

export const projectIdSchema = z.object({
  id: z.string(),
});

export type DbProject = z.infer<typeof dbProjectSchema>;

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

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
  parents: z.array(projectRelationSchema).nullable(),
  children: z.array(projectRelationSchema).nullable(),
  related: z.array(projectRelationSchema).nullable(),
});
