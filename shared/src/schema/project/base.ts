import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { projectTypes } from './type';

export const projectIdSchema = z.object({
  id: z.string(),
});

export const upsertProjectSchema = z.object({
  id: z.string().optional(),
  owner: nonEmptyString,
  projectName: nonEmptyString,
  description: nonEmptyString,
  startDate: isoDateString,
  endDate: isoDateString,
  lifecycleState: codeId,
  sapProjectId: z.string().nullable(),
});

export const dbProjectSchema = upsertProjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
  projectType: z.enum(projectTypes),
});

export type UpsertProject = z.infer<typeof upsertProjectSchema>;

export type DbProject = z.infer<typeof dbProjectSchema>;
