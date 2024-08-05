import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { projectIdSchema, upsertProjectSchema } from './base';

export const detailplanProjectSchema = upsertProjectSchema.extend({
  projectId: z.string().optional(),
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
  projectId: z.string(),
  geom: z.string().nullable(),
  detailplanId: nonEmptyString,
  writeUsers: z.array(z.string()),
});

export type DbDetailplanProject = z.infer<typeof dbDetailplanSchema>;

export const detailplanNotificationTemplates = [
  'new-detailplan-project',
  'update-detailplan-project',
] as const;

export type DetailplanNotificationTemplate = (typeof detailplanNotificationTemplates)[number];

export const detailplanNotificationSchema = projectIdSchema.extend({
  template: z.enum(detailplanNotificationTemplates),
});

export type DetailplanNotification = z.infer<typeof detailplanNotificationSchema>;

export const detailplanNotificationMailEventSchema = z.object({
  id: z.string(),
  sentAt: z.date(),
  sentBy: z.string(),
  templateName: z.enum(detailplanNotificationTemplates),
  to: z.array(z.string()),
  cc: z.array(z.string()),
  bcc: z.array(z.string()),
  subject: z.string(),
  html: z.string(),
});

export type DetailPlanNotificationMailEvent = z.infer<typeof detailplanNotificationMailEventSchema>;
