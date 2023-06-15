import { z } from 'zod';

export const environmentCodeReportSchema = z.object({
  projectId: z.string(),
  plant: z.string(),
  wbsId: z.string(),
  wbsName: z.string(),
  reasonForEnvironmentalInvestment: z.string(),
  companyCode: z.string(),
  totalActuals: z.number(),
});

export const environmentCodeReportFilterSchema = z.object({
  filters: z.object({}),
});

export const environmentCodeReportQuerySchema = environmentCodeReportFilterSchema.extend({
  offset: z.number(),
  limit: z.number(),
  sort: z
    .object({
      key: environmentCodeReportSchema.keyof(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
});

export type EnvironmentCodeReportQuery = z.infer<typeof environmentCodeReportQuerySchema>;

export const blanketContractReportSchema = z.object({
  networkId: z.string(),
  networkName: z.string(),
  projectManagerName: z.string(),
  consultCompany: z.string(),
  decisionMaker: z.string(),
  decisionDateText: z.string(),
  blanketOrderId: z.string(),
  contractPriceInCurrencySubunit: z.number(),
  networkCreatedAt: z.date(),
  totalActuals: z.number(),
});

export const blanketContractReportFilterSchema = z.object({
  filters: z.object({}),
});

export const blanketContractReportQuerySchema = blanketContractReportFilterSchema.extend({
  offset: z.number(),
  limit: z.number(),
  sort: z
    .object({
      key: blanketContractReportSchema.keyof(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
});

export type BlanketContractReportQuery = z.infer<typeof blanketContractReportQuerySchema>;
