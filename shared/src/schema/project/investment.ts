import { z } from 'zod';

import { codeId } from '../code';
import { nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const investmentProjectSchema = upsertProjectSchema.extend({
  id: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
  personInCharge: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
});

export type InvestmentProject = z.infer<typeof investmentProjectSchema>;

export const dbInvestmentProjectSchema = investmentProjectSchema.extend({
  id: z.string(),
  parentId: z.string(),
  geom: z.string().nullable(),
});

export type DbInvestmentProject = z.infer<typeof dbInvestmentProjectSchema>;
