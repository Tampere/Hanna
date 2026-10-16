import { z } from 'zod';

import { isoDateString, nonEmptyString } from './common.js';

export const upsertFrameworkAgreementSchema = z.object({
  id: z.string().optional().nullable(),
  recordNumber: nonEmptyString,
  name: nonEmptyString,
  recordId: nonEmptyString,
  validUntil: isoDateString.optional().nullable(),
});

export const frameworkAgreementSchema = upsertFrameworkAgreementSchema.extend({
  id: z.string(),
  validUntil: isoDateString.nullable(),
  isValid: z.boolean(),
});

export const frameworkAgreementIdSchema = z.object({
  id: nonEmptyString,
});

export type UpsertFrameworkAgreement = z.infer<typeof upsertFrameworkAgreementSchema>;
export type FrameworkAgreement = z.infer<typeof frameworkAgreementSchema>;
