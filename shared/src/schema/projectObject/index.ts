import { z } from 'zod';

import { dbInvestmentProjectObjectSchema } from './investment.js';
import { dbMaintenanceProjectObjectSchema } from './maintenance.js';

export const mergedProjectObjectDbSchema = dbInvestmentProjectObjectSchema.merge(
  dbMaintenanceProjectObjectSchema,
);

export type MergedDbProjectObject = z.infer<typeof mergedProjectObjectDbSchema>;

export const dbProjectObjectGeometrySchema = mergedProjectObjectDbSchema.pick({
  geom: true,
  projectObjectId: true,
  objectName: true,
});
