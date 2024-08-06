import { z } from 'zod';

import { codeId } from '../code.js';
import { nonEmptyString } from '../common.js';
import { upsertProjectSchema } from './base.js';

export const investmentProjectSchema = upsertProjectSchema.extend({
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
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
