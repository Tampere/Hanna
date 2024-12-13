import { z } from 'zod';

import { nonEmptyString } from './common.js';
import { projectSearchSchema } from './project/index.js';
import { projectObjectSearchSchema } from './projectObject/search.js';
import { workTableSearchSchema } from './workTable.js';

export const projectSearchParamsSchema = projectSearchSchema
  .required()
  .omit({ limit: true, projectTypes: true, withProjectObjects: true });
export type ProjectSearchParams = z.infer<typeof projectSearchParamsSchema>;

export const projectObjectSearchParamsSchema = projectObjectSearchSchema
  .required()
  .omit({ limit: true, projectId: true });
export type ProjectObjectSearchParams = z.infer<typeof projectObjectSearchParamsSchema>;

export const userSavedSearchFilterSchema = z.object({
  filterId: nonEmptyString,
  filterName: z.string(),
  projectSearch: projectSearchParamsSchema.omit({ map: true }).optional(),
  projectObjectSearch: projectObjectSearchParamsSchema.omit({ map: true }).optional(),
  worktableSearch: workTableSearchSchema.optional(),
});

export const userSavedSearchParamsSchema = userSavedSearchFilterSchema.omit({
  filterId: true,
  filterName: true,
});

export type UserSavedSearchFilter = z.infer<typeof userSavedSearchFilterSchema>;
export type UserSavedSearchParams = z.infer<typeof userSavedSearchParamsSchema>;

export const filterType = userSavedSearchFilterSchema
  .omit({ filterName: true, filterId: true })
  .keyof();
export type FilterType = z.infer<typeof filterType>;
