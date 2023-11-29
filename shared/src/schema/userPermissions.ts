import { z } from 'zod';

import { DbProject } from './project/base';
import { User as CtxUser } from './user';

export const userRoleSchema = z.enum(['Hanna.Admin', 'Hanna.User']);

export type UserRole = z.infer<typeof userRoleSchema>;

export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'Hanna.Admin';
}

const permissionSchema = z.enum([
  'investmentProject.write',
  'detailplanProject.write',
  'financials.write',
]);

type Permission = z.infer<typeof permissionSchema>;

export const userSchema = z.object({
  userId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  userRole: userRoleSchema,
  isAdmin: z.boolean(),
  permissions: z.array(permissionSchema).nullable(),
});

export type User = z.infer<typeof userSchema>;

export const setPermissionSchema = z.array(
  z.object({
    userId: z.string(),
    permissions: z.array(permissionSchema),
  })
);

export const permissionContextSchema = z.object({
  owner: z.string(),
  writeUsers: z.array(z.string()),
});

export type ProjectPermissionContext = z.infer<typeof permissionContextSchema>;

export type ProjectAccessChecker = (
  user: CtxUser,
  permissionCtx: ProjectPermissionContext
) => boolean;

export const isProjectIdInput = (input: any): input is { projectId: string } => {
  return input && typeof input.projectId === 'string';
};

export function ownsProject(user: CtxUser, permissionCtx: ProjectPermissionContext): boolean {
  return user.id === permissionCtx.owner;
}

export function hasWritePermission(
  user: CtxUser,
  permissionCtx: ProjectPermissionContext
): boolean {
  console.log({ user, permissionCtx });
  return permissionCtx.writeUsers.includes(user.id);
}
