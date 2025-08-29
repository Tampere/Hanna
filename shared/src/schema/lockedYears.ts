import { z } from 'zod';

export const lockedYearSchema = z
  .number()
  .int()
  .min(2000, 'Year must be 2000 or later')
  .max(2100, 'Year must be 2100 or earlier');

export const lockedYearsSchema = z.array(lockedYearSchema);
