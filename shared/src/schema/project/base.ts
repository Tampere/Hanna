import { z } from 'zod';

import { codeId } from '../code';
import { nonEmptyString } from '../common';

export const projectIdSchema = z.object({
  id: z.string(),
});

export const upsertProjectSchema = z.object({
  id: z.string().optional(),
  owner: nonEmptyString,
  projectName: nonEmptyString,
  description: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
  sapProjectId: z.string().nullable(),
});

export type UpsertProject = z.infer<typeof upsertProjectSchema>;
