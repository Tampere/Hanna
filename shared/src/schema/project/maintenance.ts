import { z } from 'zod';

import { codeId } from '../code';
import { nonEmptyString } from '../common';
import { upsertProjectSchema } from './base';

export const maintenanceProjectSchema = upsertProjectSchema.extend({
  projectId: z.string().optional(),
  parentId: z.string().optional(),
  owner: nonEmptyString,
  committees: z.array(codeId).superRefine((committees) => committees.length > 0),
  geom: z.string().nullable().optional(),
});

export type MaintenanceProject = z.infer<typeof maintenanceProjectSchema>;

export const dbMaintenanceProjectSchema = maintenanceProjectSchema.extend({
  projectId: z.string(),
  parentId: z.string(),
  geom: z.string().nullable(),
  writeUsers: z.array(z.string()),
});

export type DbMaintenanceProject = z.infer<typeof dbMaintenanceProjectSchema>;
