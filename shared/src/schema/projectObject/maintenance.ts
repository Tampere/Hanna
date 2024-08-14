import { z } from 'zod';

import { codeId } from '../code.js';
import { commonDbProjectObjectSchema, newProjectObjectSchema } from './base.js';

export const newMaintenanceProjectObjectSchema = newProjectObjectSchema.extend({
  contract: z.string().nullish(),
  poNumber: z.string().nullish(),
  procurementMethod: codeId.nullish(),
});

export const updateMaintenanceProjectObjectSchema = newMaintenanceProjectObjectSchema
  .partial()
  .extend({
    projectObjectId: z.string(),
  });

export const upsertMaintenanceProjectObjectSchema = z.union([
  newMaintenanceProjectObjectSchema,
  updateMaintenanceProjectObjectSchema,
]);

export type UpsertMaintenanceProjectObject = z.infer<typeof upsertMaintenanceProjectObjectSchema>;

export const dbMaintenanceProjectObjectSchema = newMaintenanceProjectObjectSchema.merge(
  commonDbProjectObjectSchema,
);

export type NewMaintenanceProjectObject = z.infer<typeof newMaintenanceProjectObjectSchema>;
export type UpdateMaintenanceProjectObject = z.infer<typeof updateMaintenanceProjectObjectSchema>;
