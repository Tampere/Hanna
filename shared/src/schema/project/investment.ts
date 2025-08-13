import { z } from 'zod';

import { codeId } from '../code.js';
import { nonEmptyString } from '../common.js';
import { upsertProjectSchema } from './base.js';

export const investmentProjectSchema = upsertProjectSchema.extend({
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
  target: codeId,
  geom: z.string().nullable().optional(),
  palmGrouping: codeId,
});

export type InvestmentProject = z.infer<typeof investmentProjectSchema>;

export const dbInvestmentProjectSchema = investmentProjectSchema.extend({
  projectId: z.string(),
  parentId: z.string(),
  geom: z.string().nullable(),
  geometryDump: z.array(z.string()).nullish(),
  writeUsers: z.array(z.string()),
  palmGrouping: codeId
});

export type DbInvestmentProject = z.infer<typeof dbInvestmentProjectSchema>;
