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

export const projectGetSchema = z.object({
  id: z.string(),
});

export type DbProject = z.infer<typeof dbProjectSchema>;

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

export const searchResultSchema = z.array(dbProjectSchema);

export type SearchResult = z.infer<typeof searchResultSchema>;

export const updateGeometrySchema = z.object({
  id: z.string(),
  geometry: z.string(),
})

export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;
