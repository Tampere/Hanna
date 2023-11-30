import { z } from 'zod';

import { userRoleSchema } from './userPermissions';

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: userRoleSchema,
  permissions: z.array(z.string()),
});

export type User = z.infer<typeof userSchema>;
