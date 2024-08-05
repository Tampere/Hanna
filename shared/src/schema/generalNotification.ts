import { z } from 'zod';

import { isoDateString, nonEmptyString } from './common';

export const dbGeneralNotificationSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  message: z.record(z.string(), z.any()),
  createdAt: isoDateString,
  publisher: nonEmptyString,
});

export const searchGeneralNotificationsSchema = dbGeneralNotificationSchema
  .omit({ id: true })
  .extend({
    id: nonEmptyString.optional(),
    actualEntries: z.undefined(), // For DataTable types to work
  });

export const upsertGeneralNotificationSchema = dbGeneralNotificationSchema
  .pick({
    title: true,
    message: true,
  })
  .extend({ id: nonEmptyString.nullable() });

export type UpsertGeneralNotification = z.infer<typeof upsertGeneralNotificationSchema>;
export type GeneralNotification = z.infer<typeof dbGeneralNotificationSchema>;
