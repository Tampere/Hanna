import { z } from 'zod';

import { isoDateString } from './common.js';

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
  BLART: z.string().nullable().optional(), // Document type of FI reference document // NOTE!! optional until production SAP API is updated
  VBUND: z.string().nullable(), // Company ID of Trading Partner
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
  documentType: z.string().nullable().optional(), // NOTE!! optional until production SAP API is updated
  tradingPartnerId: z.string().nullable(),
});

export type SAPActual = z.infer<typeof sapActualSchema>;

export const sapActualsSchema = z.array(sapActualSchema);

export const yearlyActualsSchema = z.array(
  z.object({
    year: z.number(),
    total: z.number().int(),
  }),
);

export const yearlyAndCommitteeActualsSchema = z
  .object({
    byCommittee: z.array(
      z.object({ year: z.number(), total: z.number().int(), committeeId: z.string() }),
    ),
    yearlyActuals: yearlyActualsSchema,
  })
  .nullable();

export type YearlyActuals = z.infer<typeof yearlyActualsSchema>;
export type yearlyAndCommitteeActuals = z.infer<typeof yearlyAndCommitteeActualsSchema>;
