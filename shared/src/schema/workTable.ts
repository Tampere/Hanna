import { z } from 'zod';

import { nonEmptyString } from './common';
import { upsertProjectSchema } from './project/base';
import { upsertProjectObjectSchema } from './projectObject';

export const workTableSearchSchema = z.object({
  projectName: z.string().optional(),
  projectObjectName: z.string().optional(),
  startDate: upsertProjectObjectSchema.shape.startDate.optional().nullable(),
  endDate: upsertProjectObjectSchema.shape.endDate.optional().nullable(),
  objectType: upsertProjectObjectSchema.shape.objectType.optional(),
  objectCategory: upsertProjectObjectSchema.shape.objectCategory.optional(),
  objectUsage: upsertProjectObjectSchema.shape.objectUsage.optional(),
  lifecycleState: z.array(upsertProjectObjectSchema.shape.lifecycleState).optional(),
});

export type WorkTableSearch = z.infer<typeof workTableSearchSchema>;

export const workTableRowSchema = z.object({
  id: nonEmptyString,
  objectName: upsertProjectObjectSchema.shape.objectName,
  lifecycleState: upsertProjectObjectSchema.shape.lifecycleState,
  dateRange: z.object({
    startDate: upsertProjectObjectSchema.shape.startDate,
    endDate: upsertProjectObjectSchema.shape.endDate,
  }),
  projectLink: z.object({
    projectId: upsertProjectObjectSchema.shape.projectId,
    projectName: upsertProjectSchema.shape.projectName,
  }),
  objectType: upsertProjectObjectSchema.shape.objectType,
  objectCategory: upsertProjectObjectSchema.shape.objectCategory,
  objectUsage: upsertProjectObjectSchema.shape.objectUsage,
  objectOperatives: z.object({
    rakennuttajaUser: upsertProjectObjectSchema.shape.rakennuttajaUser,
    suunnitteluttajaUser: upsertProjectObjectSchema.shape.suunnitteluttajaUser,
  }),
  objectFinances: z.object({
    budget: z.number(),
    actual: z.number(),
  }),
});

export const workTableRowUpdateSchema = workTableRowSchema
  .omit({
    id: true,
    projectLink: true,
  })
  .partial();

export type WorkTableRow = z.infer<typeof workTableRowSchema>;

export type WorkTableRowUpdate = z.infer<typeof workTableRowUpdateSchema>;

export const projectsUpdateSchema = z.record(workTableRowUpdateSchema);

export type ProjectsUpdate = z.infer<typeof projectsUpdateSchema>;
