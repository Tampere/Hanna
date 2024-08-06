import { z } from 'zod';

import { codeId } from '../code.js';
import { nonEmptyString } from '../common.js';
import { upsertProjectSchema } from './base.js';

export const maintenanceProjectSchema = upsertProjectSchema.extend({
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
  geom: z.string().nullish(),
  contract: z.string().nullish(),
  decision: z.string().nullish(),
  poNumber: z.string().nullish(),
});

export type MaintenanceProject = z.infer<typeof maintenanceProjectSchema>;

export const dbMaintenanceProjectSchema = maintenanceProjectSchema.extend({
  projectId: z.string(),
  parentId: z.string(),
  geom: z.string().nullable(),
  writeUsers: z.array(z.string()),
});

export type DbMaintenanceProject = z.infer<typeof dbMaintenanceProjectSchema>;
