import { z } from 'zod';

import { isoDateString } from './common';

export const incomingItemSchema = z.object({
  BELNR: z.string(), // Document number
  GJAHR: z.string(), // Fiscal year
  BLDAT: isoDateString, // Document date
  BUDAT: isoDateString, // Posting date
  CPUDT: isoDateString, // Date Document Was Created
  PSPID: z.string(), // Project ID
  POSID: z.string(), // WBS Element ID
  AUFNR: z.string().nullable(), // Network ID
  VORNR: z.string().nullable(), // Activity ID
  OBJ_TXT: z.string(), // Textual description
  OBART: z.string(), // Object type
  TWAER: z.string(), // Currency
  WTGBTR: z.string(), // Total value in Transaction Currency
  BEKNZ: z.string(), // Debit / Credit Indicator
});

export const incomingSapActualsSchema = z.array(incomingItemSchema);

export const sapActualSchema = z.object({
  documentNumber: z.string(),
  description: z.string(),
  sapProjectId: z.string(),
  wbsElementId: z.string(),
  networkId: z.string().nullable(),
  activityId: z.string().nullable(),
  fiscalYear: z.string(),
  documentDate: isoDateString,
  postingDate: isoDateString,
  creationDate: isoDateString,
  objectType: z.enum(['NV', 'PR']),
  currency: z.string(),
  valueInCurrencySubunit: z.number().int(),
  entryType: z.enum(['DEBIT', 'CREDIT']),
});

export type SAPActual = z.infer<typeof sapActualSchema>;

export const sapActualsSchema = z.array(sapActualSchema);
