import { z } from 'zod';

import { User as CtxUser } from './user';

const ADMIN_ROLE = 'Hanna.Admin' as const;
const USER_ROLE = 'Hanna.User' as const;

export const userRoleSchema = z.enum([ADMIN_ROLE, USER_ROLE]);

export type UserRole = z.infer<typeof userRoleSchema>;

export function isAdmin(userRole: UserRole): boolean {
  return userRole === ADMIN_ROLE;
}

export const ALL_PERMISSIONS = [
  'investmentProject.write',
  'detailplanProject.write',
  'financials.write',
] as const;

const permissionSchema = z.enum(ALL_PERMISSIONS);

type Permission = z.infer<typeof permissionSchema>;

export const userSchema = z.object({
  userId: z.string(),
  userEmail: z.string(),
  userName: z.string(),
  userRole: userRoleSchema,
  isAdmin: z.boolean(),
  permissions: z.array(permissionSchema),
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

export const isProjectObjectIdInput = (input: any): input is { projectObjectId: string } => {
  return input && typeof input.projectObjectId === 'string';
};

export const isTaskIdInput = (input: any): input is { taskId: string } => {
  return input && typeof input.taskId === 'string';
};

export function ownsProject(user: CtxUser, permissionCtx: ProjectPermissionContext): boolean {
  return (
    user.role === ADMIN_ROLE || (Boolean(permissionCtx?.owner) && user.id === permissionCtx.owner)
  );
}

export function hasWritePermission(
  user: CtxUser,
  permissionCtx: ProjectPermissionContext
): boolean {
  return user.role === ADMIN_ROLE || permissionCtx?.writeUsers?.includes(user.id);
}

export function hasPermission(user: CtxUser, permission: Permission): boolean {
  return user.role === ADMIN_ROLE || user.permissions.includes(permission);
}
