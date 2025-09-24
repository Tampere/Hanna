import { z } from 'zod';

import { nonEmptyString } from './common.js';

export const companySchema = z.object({
  businessId: nonEmptyString,
  companyName: nonEmptyString,
  id: nonEmptyString.optional(),
});

export const companyIdSchema = z.object({
  businessId: nonEmptyString,
});

export const companyContactSchema = z.object({
  id: z.string().optional(),
  contactName: nonEmptyString,
  phoneNumber: nonEmptyString,
  emailAddress: nonEmptyString,
  companyId: nonEmptyString,
});

export const companyContactIdSchema = z.object({
  id: nonEmptyString,
});

export const companyContactSearchQuerySchema = z.object({
  query: z.string(),
});

export const companyContactSearchResultSchema = z.object({
  id: z.string().optional(),
  contactName: nonEmptyString,
  phoneNumber: nonEmptyString,
  emailAddress: nonEmptyString,
  companyName: nonEmptyString,
  businessId: nonEmptyString,
});

const dbCompanyContact = companyContactSchema.required();

export type Company = z.infer<typeof companySchema>;
export type CompanyContact = z.infer<typeof dbCompanyContact>;
export type DeleteCompany = z.infer<typeof companyIdSchema>;
export type UpsertCompanyContact = z.infer<typeof companyContactSchema>;
export type DeleteCompanyContact = z.infer<typeof companyContactIdSchema>;
export type CompanyContactSearchResult = z.infer<typeof companyContactSearchResultSchema>;
