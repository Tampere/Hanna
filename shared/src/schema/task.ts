import { z } from 'zod';

import { codeId } from './code';
import { isoDateString, nonEmptyString } from './common';

export const upsertTaskSchema = z.object({
  id: z.string().optional(),
  projectObjectId: z.string(),
  taskName: z.string(),
  description: nonEmptyString,
  lifecycleState: codeId,
  taskType: codeId,
  startDate: isoDateString,
  endDate: isoDateString,
});

export const dbTaskSchema = upsertTaskSchema.extend({
  id: z.string(),
});

export const getTaskParams = z.object({
  id: z.string(),
});

export const taskIdSchema = z.object({
  id: z.string(),
});

export type UpsertTask = z.infer<typeof upsertTaskSchema>;
