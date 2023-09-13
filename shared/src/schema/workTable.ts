import { z } from 'zod';

import { nonEmptyString } from './common';
import { upsertProjectSchema } from './project/base';
import { upsertProjectObjectSchema } from './projectObject';

export const workTableSearchSchema = z.object({
  projectName: z.string().optional(),
  projectObjectName: z.string().optional(),
  startDate: upsertProjectObjectSchema.shape.startDate.optional().nullable(),
  endDate: upsertProjectObjectSchema.shape.endDate.optional().nullable(),
  projectObjectType: upsertProjectObjectSchema.shape.objectType.optional(),
  projectObjectCategory: upsertProjectObjectSchema.shape.objectCategory.optional(),
  projectObjectUsage: upsertProjectObjectSchema.shape.objectUsage.optional(),
  projectObjectLifecycleState: z.array(upsertProjectObjectSchema.shape.lifecycleState).optional(),
});

export type WorkTableSearch = z.infer<typeof workTableSearchSchema>;

export const workTableRowSchema = z.object({
  id: nonEmptyString,
  projectObjectName: upsertProjectObjectSchema.shape.objectName,
  projectObjectState: upsertProjectObjectSchema.shape.lifecycleState,
  projectDateRange: z.object({
    startDate: upsertProjectObjectSchema.shape.startDate,
    endDate: upsertProjectObjectSchema.shape.endDate,
  }),
  projectLink: z.object({
    projectId: upsertProjectObjectSchema.shape.projectId,
    projectName: upsertProjectSchema.shape.projectName,
  }),
  projectObjectType: upsertProjectObjectSchema.shape.objectType,
  projectObjectCategory: upsertProjectObjectSchema.shape.objectCategory,
  projectObjectUsage: upsertProjectObjectSchema.shape.objectUsage,
  projectObjectPersonInfo: z.object({
    rakennuttajaUser: upsertProjectObjectSchema.shape.rakennuttajaUser,
    suunnitteluttajaUser: upsertProjectObjectSchema.shape.suunnitteluttajaUser,
  }),
  projectObjectFinances: z.object({
    budget: z.number(),
    actual: z.number(),
  }),
});

export type WorkTableRow = z.infer<typeof workTableRowSchema>;
