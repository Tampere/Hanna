import { z } from 'zod';

import { codeId } from '../code.js';
import { nonEmptyString } from '../common.js';
import { commonDbProjectObjectSchema, newProjectObjectSchema } from './base.js';

export const newInvestmentProjectObjectSchema = newProjectObjectSchema.extend({
  objectStage: codeId,
  objectType: z.array(codeId).superRefine((value) => value.length > 0),
  committee: nonEmptyString,
});

export const updateInvestmentProjectObjectSchema = newInvestmentProjectObjectSchema
  .partial()
  .extend({
    projectObjectId: z.string(),
  });

export const upsertInvestmentProjectObjectSchema = z.union([
  newInvestmentProjectObjectSchema,
  updateInvestmentProjectObjectSchema,
]);

export type UpsertInvestmentProjectObject = z.infer<typeof upsertInvestmentProjectObjectSchema>;

export type NewInvestmentProjectObject = z.infer<typeof newInvestmentProjectObjectSchema>;
export type UpdateInvestmentProjectObject = z.infer<typeof updateInvestmentProjectObjectSchema>;

export const dbInvestmentProjectObjectSchema = newInvestmentProjectObjectSchema.merge(
  commonDbProjectObjectSchema,
);
