import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { projectTypes } from './type';

export const projectIdSchema = z.object({
  projectId: z.string(),
});

export const upsertProjectSchema = z.object({
  projectId: z.string().optional(),
  owner: nonEmptyString,
  projectName: nonEmptyString,
  description: nonEmptyString,
  startDate: isoDateString,
  endDate: isoDateString,
  lifecycleState: codeId,
  sapProjectId: z.string().nullable(),
});

export const dbProjectSchema = upsertProjectSchema.extend({
  projectId: z.string(),
  geom: z.string().nullable(),
  projectType: z.enum(projectTypes),
  detailplanId: z.number().nullable(),
});

export type UpsertProject = z.infer<typeof upsertProjectSchema>;

export type DbProject = z.infer<typeof dbProjectSchema>;
