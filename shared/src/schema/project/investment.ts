import { z } from 'zod';

import { codeId } from '../code';
import { nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const investmentProjectSchema = upsertProjectSchema.extend({
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
  personInCharge: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
  geom: z.string().nullable().optional(),
});

export type InvestmentProject = z.infer<typeof investmentProjectSchema>;

export const dbInvestmentProjectSchema = investmentProjectSchema.extend({
  projectId: z.string(),
  parentId: z.string(),
  geom: z.string().nullable(),
  writeUsers: z.array(z.string()),
});

export type DbInvestmentProject = z.infer<typeof dbInvestmentProjectSchema>;
