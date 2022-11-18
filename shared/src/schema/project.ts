import { z } from 'zod';

export const upsertProjectSchema = z.object({
  id: z.string().optional(),
  projectName: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  endDate: z.string().regex(/\d{4}-\d{2}-\d{2}/),
});

export type UpsertProject = z.infer<typeof upsertProjectSchema>;

export const projectSearchSchema = z.object({
  text: z.string().optional(),
});

export const dbProjectSchema = upsertProjectSchema.extend({
  id: z.string(),
});

export const projectIdSchema = z.object({
  id: z.string(),
});

export type DbProject = z.infer<typeof dbProjectSchema>;

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

export const updateGeometrySchema = z.object({
  id: z.string(),
  geometry: z.string(),
});

export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;

export const updateGeometryResultSchema = z.object({
  id: z.string(),
  geometry: z.string(),
});

export type UpdateGeometryResult = z.infer<typeof updateGeometryResultSchema>;
