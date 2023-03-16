import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';

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

export type UpsertProject = z.infer<typeof upsertProjectSchema>;
