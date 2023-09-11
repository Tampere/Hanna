import { z } from 'zod';

import { upsertProjectObjectSchema } from './projectObject';

export const workTableSearchSchema = z.object({
  projectName: z.string().optional(),
  projectObjectName: z.string().optional(),
  startDate: upsertProjectObjectSchema.shape.startDate.optional(),
  endDate: upsertProjectObjectSchema.shape.endDate.optional(),
  projectObjectType: upsertProjectObjectSchema.shape.objectType.optional(),
  projectObjectCategory: upsertProjectObjectSchema.shape.objectCategory.optional(),
  projectObjectUsage: upsertProjectObjectSchema.shape.objectUsage.optional(),
  projectObjectLifecycleState: upsertProjectObjectSchema.shape.lifecycleState.optional(),
});

export type WorkTableSearch = z.infer<typeof workTableSearchSchema>;
