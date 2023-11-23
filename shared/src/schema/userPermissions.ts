import { z } from 'zod';

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
