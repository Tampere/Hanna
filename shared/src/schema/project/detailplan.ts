import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const detailplanProjectSchema = upsertProjectSchema.extend({
  id: z.string().optional(),
  detailplanId: z.string().optional(),
  diaryId: nonEmptyString,
  diaryDate: isoDateString.nullish(),
  subtype: codeId.nullish(),
  planningZone: codeId.nullish(),
  preparer: nonEmptyString,
  technicalPlanner: z.string().nullish(),
  district: nonEmptyString,
  blockName: nonEmptyString,
  addressText: nonEmptyString,
  initiativeDate: isoDateString.nullish(),
  applicantName: z.string().optional(),
  applicantAddress: z.string().optional(),
  applicantObjective: z.string().optional(),
  additionalInfo: z.string().nullish(),
});

export type DetailplanProject = z.infer<typeof detailplanProjectSchema>;

export const dbDetailplanSchema = detailplanProjectSchema.extend({
  id: z.string(),
  geom: z.string().nullable(),
  detailplanId: nonEmptyString,
});

export type DbDetailplanProject = z.infer<typeof dbDetailplanSchema>;
