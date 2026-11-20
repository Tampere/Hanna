import { z } from 'zod';

import { codeId } from './code.js';
import { isoDateString, nonEmptyString } from './common.js';
import { endDateSchema } from './sapIdentifierRequest.js';

/**
 * Amounts are in cents, like budget amounts. The phase name is stored with the price, so the
 * cost centre -> phase mapping can change without affecting sent requests.
 */
export const phasePriceSchema = z.object({
  phaseCode: nonEmptyString,
  phaseName: z.string(),
  amount: z.number().int().nonnegative(),
});

export type PhasePrice = z.infer<typeof phasePriceSchema>;

/** Purchase request form (Figma 6307-1003). Sending again replaces the existing request. */
export const upsertPurchaseRequestSchema = z
  .object({
    id: z.string().optional().nullable(),
    projectObjectId: nonEmptyString,
    responsiblePerson: nonEmptyString,
    orderer: nonEmptyString,
    companyId: nonEmptyString,
    /** Urakoitsijan edustaja of the kohde (Toimijat). Added to the kohde roles if missing. */
    companyContactId: nonEmptyString,
    /** Kohde dates: prefilled from the kohde, written back when changed. */
    startDate: isoDateString,
    endDate: endDateSchema,
    costCenterId: nonEmptyString,
    frameworkAgreementId: z.string().nullable(),
    vatRate: codeId,
    isContractPrice: z.boolean(),
    contractPrice: z.number().int().nonnegative().nullable(),
    phasePrices: z.array(phasePriceSchema),
    /** Lisätietoja: free text for finance, stored on the request only. */
    additionalInfo: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.isContractPrice && value.contractPrice == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractPrice'],
        message: 'purchaseRequest.error.contractPriceRequired',
      });
    }
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'purchaseRequest.error.endDateBeforeStartDate',
      });
    }
  });

export type UpsertPurchaseRequest = z.infer<typeof upsertPurchaseRequestSchema>;

export const purchaseRequestSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectObjectId: z.string(),
  objectName: z.string(),
  projectType: z.enum(['investmentProject', 'maintenanceProject']),
  responsiblePerson: z.string(),
  orderer: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  companyContactId: z.string().nullable(),
  startDate: isoDateString,
  endDate: endDateSchema,
  costCenterId: z.string(),
  costCenterName: z.string(),
  frameworkAgreementId: z.string().nullable(),
  frameworkAgreementName: z.string().nullable(),
  /** Sopimustunniste of the framework agreement. */
  frameworkAgreementRecordId: z.string().nullable(),
  vatRate: codeId,
  isContractPrice: z.boolean(),
  contractPrice: z.number().nullable(),
  phasePrices: z.array(phasePriceSchema),
  additionalInfo: z.string().nullable(),
  purchaseOrderNumber: z.string().nullable(),
  responsiblePersonName: z.string(),
  ordererName: z.string(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sentAt: z.date().nullable(),
});

export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;

export const setPurchaseOrderNumberSchema = z.object({
  id: nonEmptyString,
  purchaseOrderNumber: nonEmptyString,
});

export type SetPurchaseOrderNumber = z.infer<typeof setPurchaseOrderNumberSchema>;

export const costCenterSchema = z.object({
  id: z.string(),
  name: z.string(),
  phases: z.array(z.object({ phaseCode: z.string(), name: z.string() })),
});

export type CostCenter = z.infer<typeof costCenterSchema>;

/** Sum of phase prices in cents. */
export function sumPhasePrices(phasePrices: PhasePrice[]) {
  return phasePrices.reduce((sum, { amount }) => sum + amount, 0);
}

/** Values for a new purchase request, prefilled from the kohde. */
export const purchaseRequestDefaultsSchema = z.object({
  objectName: z.string(),
  sapWbsId: z.string().nullable(),
  startDate: isoDateString.nullable(),
  endDate: endDateSchema.nullable(),
  /** First Urakoitsijan edustaja of the kohde, and its company. */
  companyId: z.string().nullable(),
  companyContactId: z.string().nullable(),
  /** Only investment kohteet have a framework agreement column (written back when changed). */
  hasFrameworkAgreement: z.boolean(),
  frameworkAgreementId: z.string().nullable(),
  /** From the kohde's SAP identifier request, if any. Request only. */
  costCenterId: z.string().nullable(),
  /**
   * Budget year the contract price is written to when "Sopimushinta" is selected: the current
   * year, clamped to the kohde's years so the budget stays inside the kohde dates.
   */
  contractPriceYear: z.number(),
  contractPrice: z.number().nullable(),
});

export type PurchaseRequestDefaults = z.infer<typeof purchaseRequestDefaultsSchema>;

/** Forecast is kept as contract price - budget amount, as in the budget table. */
export function contractPriceYear(startDate: string, endDate: string, today = new Date()) {
  const startYear = Number(startDate.slice(0, 4));
  const currentYear = today.getFullYear();
  const endYear = endDate === 'infinity' ? currentYear : Number(endDate.slice(0, 4));
  return Math.min(Math.max(currentYear, startYear), Math.max(endYear, startYear));
}

export function forecastFromContractPrice(contractPrice: number, amount: number | null) {
  return contractPrice - (amount ?? 0);
}
