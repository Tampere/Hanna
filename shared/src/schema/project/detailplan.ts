import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const detailplanProjectSchema = upsertProjectSchema.extend({
  id: z.string().optional(),
  diaryId: z.string().optional(),
  diaryDate: isoDateString.optional(),
  subtype: codeId,
  planningZone: codeId,
  preparer: nonEmptyString,
  technicalPlanner: nonEmptyString,
  district: nonEmptyString,
  blockName: nonEmptyString,
  addressText: nonEmptyString,
  detailplanId: nonEmptyString,
  initiativeDate: isoDateString,
  applicantName: nonEmptyString,
  applicantAddress: nonEmptyString,
  applicantObjective: nonEmptyString,
});

export type DetailplanProject = z.infer<typeof detailplanProjectSchema>;

export const dbDetailplanSchema = upsertProjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
});

export type DbDetailplanProject = z.infer<typeof dbDetailplanSchema>;
