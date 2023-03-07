import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const detailplanProjectSchema = upsertProjectSchema.extend({
  id: z.string().optional(),
  diaryId: z.string().optional(),
  diaryDate: isoDateString.nullish(),
  subtype: codeId.optional(),
  planningZone: codeId.optional(),
  preparer: nonEmptyString,
  technicalPlanner: z.string().nullish(),
  district: nonEmptyString,
  blockName: nonEmptyString,
  addressText: nonEmptyString,
  initiativeDate: isoDateString.nullish(),
  applicantName: z.string().optional(),
  applicantAddress: z.string().optional(),
  applicantObjective: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export type DetailplanProject = z.infer<typeof detailplanProjectSchema>;

export const dbDetailplanSchema = detailplanProjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
  detailplanId: nonEmptyString,
});

export type DbDetailplanProject = z.infer<typeof dbDetailplanSchema>;
