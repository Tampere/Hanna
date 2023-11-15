import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  roles: z.array(z.string()).optional(),
});

export type User = z.infer<typeof userSchema>;
