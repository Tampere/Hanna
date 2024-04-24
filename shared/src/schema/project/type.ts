import { z } from 'zod';

export const projectTypes = ['investmentProject', 'detailplanProject'] as const;
export const projectTypeSchema = z.enum(['investmentProject', 'detailplanProject']);

export type ProjectType = z.infer<typeof projectTypeSchema>;
