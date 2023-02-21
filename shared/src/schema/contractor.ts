import { z } from 'zod';

import { nonEmptyString } from './common';

export const companySchema = z.object({
  businessId: nonEmptyString,
  companyName: nonEmptyString,
});

export const companyIdSchema = z.object({
  businessId: nonEmptyString,
});

export const contractorSchema = z.object({
  id: z.string().optional(),
  contactName: nonEmptyString,
  phoneNumber: nonEmptyString,
  emailAddress: nonEmptyString,
  businessId: nonEmptyString,
});

export const contractorIdSchema = z.object({
  id: nonEmptyString,
});

export const searchQuerySchema = z.object({
  query: z.string(),
});

export const searchResultSchema = z.object({
  id: z.string(),
  contactName: nonEmptyString,
  phoneNumber: nonEmptyString,
  emailAddress: nonEmptyString,
  companyName: nonEmptyString,
  businessId: nonEmptyString,
});

const dbContractor = contractorSchema.required();

export type Company = z.infer<typeof companySchema>;
export type Contractor = z.infer<typeof dbContractor>;
export type DeleteCompany = z.infer<typeof companyIdSchema>;
export type UpsertContractor = z.infer<typeof contractorSchema>;
export type DeleteContractor = z.infer<typeof contractorIdSchema>;
export type SearchResult = z.infer<typeof searchResultSchema>;
