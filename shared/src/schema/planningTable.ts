import { z } from 'zod';

import { codeListIdSchema } from './code.js';
import { nonEmptyString } from './common.js';
import { dbProjectSchema, upsertProjectSchema } from './project/base.js';
import { commonDbProjectObjectSchema } from './projectObject/base.js';
import { dbInvestmentProjectObjectSchema } from './projectObject/investment.js';

export const yearRange = z.object({
  start: z.number(),
  end: z.number(),
});

export const planningTableSearchSchema = z
  .object({
    committee: z.array(nonEmptyString).optional(),
    // sitovuus
    palmGrouping: z.array(codeListIdSchema.extract(['PalmKoritus'])).optional(),
    // Omistaja
    // Kohteen laji
    // Kohteen tyyppi
    // Rakennuttaja
    // suunnitteluttaja
    objectStage: z.array(dbInvestmentProjectObjectSchema.shape.objectStage).optional(),
    // Omat kohteet
    yearRange: yearRange.optional(),
  })
  .default({});

export type PlanningTableSearch = z.infer<typeof planningTableSearchSchema>;

// Schema for yearly columns - each year has estimate and actual values
const yearlyColumnSchema = z.object({
  estimate: z.number().nullable(),
  actual: z.number().nullable(), // Only shown for past/current years
});

// Base row schema with common fields
const baseRowSchema = z.object({
  id: nonEmptyString,
  type: z.enum(['project', 'projectObject']), // Discriminator field
});

const projectObjectRow = baseRowSchema.extend({
  type: z.literal('projectObject'),
  projectObjectName: commonDbProjectObjectSchema.shape.objectName,
  projectName: dbProjectSchema.shape.projectName,
  budget: z.array(
    z
      .object({
        amount: z.number().nullable(),
        actual: z.number().nullable(),
        year: z.number(),
      })
      .nullable(),
  ),
  // Dynamic yearly columns will be added at runtime based on active years
  // e.g., year2024: { estimate: number, actual: number }, year2025: { estimate: number, actual: null }
});

const projectRow = baseRowSchema.extend({
  type: z.literal('project'),
  projectName: dbProjectSchema.shape.projectName,
  projectObjectName: z.null().default(null),
  // Dynamic yearly columns will be added at runtime
});

export const planningTableRowSchema = z.union([projectObjectRow, projectRow]);
export const planningTableRowResult = z.array(planningTableRowSchema);
export type ProjectObjectRow = z.infer<typeof projectObjectRow>;
export type ProjectRow = z.infer<typeof projectRow>;
export type PlanningTableRow = z.infer<typeof planningTableRowSchema>;
