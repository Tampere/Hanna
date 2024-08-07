import { z } from 'zod';

import { codeId } from './code.js';
import { isoDateString, nonEmptyString } from './common.js';

export const upsertTaskSchema = z.object({
  taskId: z.string().optional(),
  projectObjectId: z.string(),
  taskName: nonEmptyString,
  description: nonEmptyString,
  lifecycleState: codeId,
  taskType: codeId,
  startDate: isoDateString,
  endDate: isoDateString,
});

export const dbTaskSchema = upsertTaskSchema.extend({
  taskId: z.string(),
});

export const getTaskParams = z.object({
  taskId: z.string(),
});

export const taskIdSchema = z.object({
  taskId: z.string(),
});

export const yearBudgetSchema = z.object({
  year: z.number(),
  budgetItems: z.object({
    amount: z.number().nullable(),
  }),
});

export const updateBudgetSchema = z.object({
  taskId: z.string().optional(),
  budgetItems: z.array(
    z.object({
      year: z.number(),
      amount: z.number().nullable(),
    }),
  ),
});

export type UpsertTask = z.infer<typeof upsertTaskSchema>;

export type DbTask = z.infer<typeof dbTaskSchema>;

export type BudgetUpdate = z.infer<typeof updateBudgetSchema>;
