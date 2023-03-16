export const projectTypes = ['investmentProject', 'detailplanProject'] as const;

export type ProjectType = typeof projectTypes[number];
