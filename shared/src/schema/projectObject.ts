import { z } from 'zod';

import { isoDateStringRegex } from '../utils';

export const projectObject = z.object({
  projectId: z.string(),
  id: z.string(),
  objectName: z.string(),
  description: z.string(),
  createdAt: z.string().regex(isoDateStringRegex),
  geom: z.string(),
  lifecycleState: z.enum(['TODO']),
  objectType: z.enum(['TODO']),
  objectClass: z.enum(['TODO']),
  objectUsage: z.enum(['TODO']),
  startDate: z.string().regex(isoDateStringRegex),
  endDate: z.string().regex(isoDateStringRegex),
  height: z.number(),
  personResponsible: z.string(),
  updatedBy: z.string(),
});
