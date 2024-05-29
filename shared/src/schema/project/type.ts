import { z } from 'zod';

export const projectTypes = [
  'investmentProject',
  'detailplanProject',
  'maintenanceProject',
] as const;
export const projectTypeSchema = z.enum([
  'investmentProject',
  'detailplanProject',
  'maintenanceProject',
]);

export type ProjectType = z.infer<typeof projectTypeSchema>;
