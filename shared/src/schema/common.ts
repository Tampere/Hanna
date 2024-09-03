import { z } from 'zod';

export const nonEmptyString = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, {});

const isoDateStringRegex = /\d{4}-\d{2}-\d{2}/;

export const isoDateString = z.string().regex(isoDateStringRegex);

export const dateStringSchema = z.string().transform((value) => {
  if (value === 'infinity') return '';
  return new Date(value);
});

export const datetimeSchema = z.date();
