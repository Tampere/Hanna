import { z } from 'zod';

import { permissionSchema, userRoleSchema } from './userPermissions.js';

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: userRoleSchema,
  permissions: z.array(permissionSchema),
});

export type User = z.infer<typeof userSchema>;

// permissions are stored/managed in app db and not coming from OIDC
export type UpsertUserInput = Omit<User, 'permissions'>;
