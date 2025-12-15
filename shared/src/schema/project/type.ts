import { z } from 'zod';

export const projectTypes = ['investmentProject', 'maintenanceProject'] as const;
export const projectTypeSchema = z.enum(['investmentProject', 'maintenanceProject']);

export type ProjectType = z.infer<typeof projectTypeSchema>;
