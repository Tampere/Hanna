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
    projectName: z.string().optional(),
    projectObjectName: z.string().optional(),
    objectType: z.array(dbInvestmentProjectObjectSchema.shape.objectType).optional(),
    objectCategory: dbInvestmentProjectObjectSchema.shape.objectCategory.optional(),
    objectUsage: dbInvestmentProjectObjectSchema.shape.objectUsage.optional(),
    lifecycleState: z.array(dbInvestmentProjectObjectSchema.shape.lifecycleState).optional(),
    objectStage: z.array(dbInvestmentProjectObjectSchema.shape.objectStage).optional(),
    objectParticipantUser: nonEmptyString.optional(),
    rakennuttajaUsers: z.array(nonEmptyString).optional(),
    suunnitteluttajaUsers: z.array(nonEmptyString).optional(),
    company: z.array(nonEmptyString).optional(),
    committee: z.array(nonEmptyString).optional(),
    projectTarget: z.array(nonEmptyString).optional(),
    projectPalmGrouping: z.array(nonEmptyString).optional(),
    objectPalmGrouping: z.array(nonEmptyString).optional(),
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
  projectId: nonEmptyString,
  projectObjectName: commonDbProjectObjectSchema.shape.objectName,
  projectName: dbProjectSchema.shape.projectName,
  objectDateRange: z.object({
    startDate: commonDbProjectObjectSchema.shape.startDate,
    endDate: commonDbProjectObjectSchema.shape.endDate,
  }),
  projectDateRange: z
    .object({
      startDate: dbProjectSchema.shape.startDate,
      endDate: dbProjectSchema.shape.endDate,
    })
    .nullable(),
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
  projectId: nonEmptyString,
  projectName: dbProjectSchema.shape.projectName,
  projectObjectName: z.null().default(null),
  projectDateRange: z
    .object({
      startDate: dbProjectSchema.shape.startDate,
      endDate: dbProjectSchema.shape.endDate,
    })
    .nullable(),
  // Dynamic yearly columns will be added at runtime
});

export const planningTableRowSchema = z.union([projectObjectRow, projectRow]);
export const planningTableRowResult = z.array(planningTableRowSchema);
export type ProjectObjectRow = z.infer<typeof projectObjectRow>;
export type ProjectRow = z.infer<typeof projectRow>;
export type PlanningTableRow = z.infer<typeof planningTableRowSchema>;

// Update schema for planning table (only amount per year for project objects)
export const planningUpdateItemSchema = z.object({
  year: z.number().int(),
  amount: z.number().nullable(),
});
export const planningUpdateSchema = z.record(z.array(planningUpdateItemSchema));
export type PlanningUpdate = z.infer<typeof planningUpdateSchema>;
