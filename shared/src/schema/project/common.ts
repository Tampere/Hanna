import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const commonProjectSchema = upsertProjectSchema.extend({
  id: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
  startDate: isoDateString,
  endDate: isoDateString,
  lifecycleState: codeId,
  projectType: codeId,
  personInCharge: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
});

export type CommonProject = z.infer<typeof commonProjectSchema>;

export const dbCommonProjectSchema = commonProjectSchema.extend({
  id: z.string(),
  parentId: z.string(),
  geom: z.string().nullable(),
});

export type DbCommonProject = z.infer<typeof dbCommonProjectSchema>;
