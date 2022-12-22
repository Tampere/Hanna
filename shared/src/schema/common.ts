import { z } from 'zod';

import { isoDateStringRegex } from '../utils';

export const nonEmptyString = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, {});

export const isoDateString = z.string().regex(isoDateStringRegex);
