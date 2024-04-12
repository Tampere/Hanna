import { z } from 'zod';

import { codeId } from '../code';
import { isoDateString, nonEmptyString } from '../common';
import { projectTypes } from './type';

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
});

export const dbProjectSchema = upsertProjectSchema.extend({
  projectId: z.string(),
  geom: z.string().nullable(),
  projectType: z.enum(projectTypes),
  detailplanId: z.number().nullable(),
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
});

export type ProjectWritePermission = z.infer<typeof projectWritePermissionSchema>;
export type UpsertProject = z.infer<typeof upsertProjectSchema>;
export type ProjectPermissions = z.infer<typeof projectPermissionSchema>;

export type DbProject = z.infer<typeof dbProjectSchema>;
