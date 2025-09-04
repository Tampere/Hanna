import { z } from 'zod';

export const lockedYearSchema = z
  .number()
  .int()
  .min(2000, 'Year must be 2000 or later')
  .max(2100, 'Year must be 2100 or earlier');

export const lockedYearsSchema = z.array(lockedYearSchema);

export function filterAndValidateYears(years: unknown[]): number[] {
  const uniqueYears = Array.from(
    new Set(
      years
        .map((year) => Number(year))
        .filter((year) => !isNaN(year) && lockedYearSchema.safeParse(year).success),
    ),
  );

  return uniqueYears;
}
