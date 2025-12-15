import { z } from 'zod';

import { codeId } from '../code.js';
import { isoDateString, nonEmptyString } from '../common.js';
import { projectTypes } from './type.js';

export const projectIdSchema = z.object({
  projectId: z.string(),
});

export const upsertProjectSchema = z.object({
  projectId: z.string().optional(),
  owner: nonEmptyString,
  projectName: nonEmptyString,
  description: nonEmptyString,
  startDate: isoDateString,
  endDate: isoDateString,
  lifecycleState: codeId,
  sapProjectId: z.string().nullable(),
  coversMunicipality: z.boolean(),
  geom: z.string().nullish(),
});

export const dbProjectSchema = upsertProjectSchema.extend({
  projectId: z.string(),
  geom: z.string().nullable(),
  projectType: z.enum(projectTypes),
  writeUsers: z.array(z.string()),
});

export const projectPermissionSchema = z.object({
  projectId: z.string(),
  permissions: z.array(
    z.object({
      userId: z.string(),
      canWrite: z.boolean(),
    }),
  ),
});

export const projectWritePermissionSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  canWrite: z.boolean(),
  isAdmin: z.boolean(),
});

export type ProjectWritePermission = z.infer<typeof projectWritePermissionSchema>;
export type UpsertProject = z.infer<typeof upsertProjectSchema>;
export type ProjectPermissions = z.infer<typeof projectPermissionSchema>;

export type DbProject = z.infer<typeof dbProjectSchema>;
