import { z } from 'zod';

export const environmentCodeReportSchema = z.object({
  projectId: z.string(),
  wbsId: z.string(),
  wbsName: z.string(),
  reasonForEnvironmentalInvestment: z.string().nullish(),
  reasonForEnvironmentalInvestmentText: z.string().nullish(),
  totalDebit: z.number().nullish(),
  totalCredit: z.number().nullish(),
  totalActuals: z.number(),
  actualEntries: z.array(
    z.object({
      totalDebit: z.number().nullish(),
      totalCredit: z.number().nullish(),
      totalActuals: z.number(),
      company: z.object({
        companyCode: z.string().nullish(),
        companyCodeText: z.string().nullish(),
      }),
    }),
  ),
  company: z
    .object({
      companyCode: z.string().nullish(),
      companyCodeText: z.string().nullish(),
    })
    .optional(),
});

export const environmentCodeReportFilterSchema = z.object({
  filters: z.object({
    text: z.string().nullable(),
    reasonsForEnvironmentalInvestment: z.array(z.string()),
    years: z.array(z.number()),
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
  networkName: z.string().nullish(),
  projectManagerName: z.string().nullish(),
  consultCompany: z.string().nullish(),
  decisionMaker: z.string().nullish(),
  decisionDateText: z.string().nullish(),
  blanketOrderId: z.string().nullish(),
  contractPriceInCurrencySubunit: z.number(),
  totalDebit: z.number().nullish(),
  totalCredit: z.number().nullish(),
  totalActuals: z.number().nullish(),
  actualEntries: z.undefined(),
});

export const blanketContractReportFilterSchema = z.object({
  filters: z.object({
    text: z.string().nullable(),
    consultCompanies: z.array(z.string()),
    blanketOrderIds: z.array(z.string()),
    years: z.array(z.number()),
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
