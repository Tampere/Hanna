import { z } from 'zod';

export const newProjectSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
});

export type NewProject = z.infer<typeof newProjectSchema>

export const projectSearchSchema = z.object({
  text: z.string().optional(),
})

export type ProjectSearch = z.infer<typeof projectSearchSchema>

export const searchResultSchema = z.array(z.object({
  id: z.string(),
  projectName: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
}))

export type SearchResult = z.infer<typeof searchResultSchema>
