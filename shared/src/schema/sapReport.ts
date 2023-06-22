import { z } from 'zod';

export const environmentCodeReportSchema = z.object({
  projectId: z.string(),
  plant: z.string(),
  wbsId: z.string(),
  wbsName: z.string(),
  reasonForEnvironmentalInvestment: z.string(),
  reasonForEnvironmentalInvestmentText: z.string(),
  companyCode: z.string(),
  companyCodeText: z.string().nullish(),
  totalActuals: z.number(),
});

export const environmentCodeReportFilterSchema = z.object({
  filters: z.object({
    text: z.string().nullable(),
    plants: z.array(z.string()),
    reasonsForEnvironmentalInvestment: z.array(z.string()),
    year: z.number().nullable(),
  }),
});

export const environmentCodeReportQuerySchema = environmentCodeReportFilterSchema.extend({
  offset: z.number().optional(),
  limit: z.number().optional(),
  sort: z
    .object({
      key: environmentCodeReportSchema.keyof(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
});

export type EnvironmentCodeReportQuery = z.infer<typeof environmentCodeReportQuerySchema>;

export const blanketContractReportSchema = z.object({
  projectId: z.string(),
  networkId: z.string(),
  networkName: z.string(),
  projectManagerName: z.string(),
  consultCompany: z.string(),
  decisionMaker: z.string(),
  decisionDateText: z.string(),
  blanketOrderId: z.string(),
  contractPriceInCurrencySubunit: z.number(),
  totalActuals: z.number().nullish(),
});

export const blanketContractReportFilterSchema = z.object({
  filters: z.object({
    text: z.string().nullable(),
    consultCompanies: z.array(z.string()),
    blanketOrderId: z.string().nullable(),
  }),
});

export const blanketContractReportQuerySchema = blanketContractReportFilterSchema.extend({
  offset: z.number().optional(),
  limit: z.number().optional(),
  sort: z
    .object({
      key: blanketContractReportSchema.keyof(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
});

export type BlanketContractReportQuery = z.infer<typeof blanketContractReportQuerySchema>;
