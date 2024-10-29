import { z } from 'zod';

import { nonEmptyString } from './common.js';

export const sapTaskSchema = z.object({
  total: z.number(),
  wbsId: nonEmptyString,
  networkId: nonEmptyString,
  activityId: nonEmptyString,
  description: z.string(),
});

export type SapTask = z.infer<typeof sapTaskSchema>;
