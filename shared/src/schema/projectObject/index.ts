import { z } from 'zod';

import { dbInvestmentProjectObjectSchema } from './investment.js';
import { dbMaintenanceProjectObjectSchema } from './maintenance.js';

export const mergedProjectObjectDbSchema = dbInvestmentProjectObjectSchema.merge(
  dbMaintenanceProjectObjectSchema,
);

export const dbObjectOrderBySchema = z.enum(['name', 'startDate', 'endDate', 'createdAt']);
export type DbObjectOrderBy = z.infer<typeof dbObjectOrderBySchema>;

export type MergedDbProjectObject = z.infer<typeof mergedProjectObjectDbSchema>;

export const dbProjectObjectGeometrySchema = mergedProjectObjectDbSchema.pick({
  geom: true,
  projectObjectId: true,
  objectName: true,
});
