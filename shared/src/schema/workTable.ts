import { z } from 'zod';

import { codeListIdSchema } from './code';
import { nonEmptyString } from './common';
import { upsertProjectSchema } from './project/base';
import { dbProjectObjectSchema } from './projectObject';

export const projectObjectYears = z.object({ year: z.number() });

export const workTableSearchSchema = z.object({
  projectName: z.string().optional(),
  projectObjectName: z.string().optional(),
  startDate: dbProjectObjectSchema.shape.startDate.optional().nullable(),
  endDate: dbProjectObjectSchema.shape.endDate.optional().nullable(),
  objectType: dbProjectObjectSchema.shape.objectType.optional(),
  objectCategory: dbProjectObjectSchema.shape.objectCategory.optional(),
  objectUsage: dbProjectObjectSchema.shape.objectUsage.optional(),
  lifecycleState: z.array(dbProjectObjectSchema.shape.lifecycleState).optional(),
  objectStage: z.array(dbProjectObjectSchema.shape.objectStage).optional(),
  objectParticipantUser: nonEmptyString.optional(),
});

export type WorkTableSearch = z.infer<typeof workTableSearchSchema>;

export const workTableRowSchema = z.object({
  id: nonEmptyString,
  objectName: dbProjectObjectSchema.shape.objectName,
  lifecycleState: dbProjectObjectSchema.shape.lifecycleState,
  dateRange: z.object({
    startDate: dbProjectObjectSchema.shape.startDate,
    endDate: dbProjectObjectSchema.shape.endDate,
  }),
  projectLink: z.object({
    projectId: dbProjectObjectSchema.shape.projectId,
    projectName: upsertProjectSchema.shape.projectName,
    projectIndex: z.number(),
  }),
  objectType: dbProjectObjectSchema.shape.objectType,
  objectCategory: dbProjectObjectSchema.shape.objectCategory,
  objectUsage: dbProjectObjectSchema.shape.objectUsage,
  operatives: z.object({
    rakennuttajaUser: dbProjectObjectSchema.shape.rakennuttajaUser,
    suunnitteluttajaUser: dbProjectObjectSchema.shape.suunnitteluttajaUser,
  }),
  budgetYear: z.number(),
  budget: z.number().nullable(),
  actual: z.number().nullable(),
  forecast: z.number().nullable(),
  kayttosuunnitelmanMuutos: z.number().nullable(),
  permissionCtx: z.object({
    writeUsers: z.array(nonEmptyString),
    owner: nonEmptyString,
  }),
});

export const workTableColumnCodesSchema = z.object({
  lifecycleState: codeListIdSchema.extract(['KohteenElinkaarentila']),
  objectType: codeListIdSchema.extract(['KohdeTyyppi']),
  objectCategory: codeListIdSchema.extract(['KohteenOmaisuusLuokka']),
  objectUsage: codeListIdSchema.extract(['KohteenToiminnallinenKayttoTarkoitus']),
});

export const workTableColumnCodes = workTableColumnCodesSchema.parse({
  lifecycleState: 'KohteenElinkaarentila',
  objectType: 'KohdeTyyppi',
  objectCategory: 'KohteenOmaisuusLuokka',
  objectUsage: 'KohteenToiminnallinenKayttoTarkoitus',
});

export const workTableColumnCodeKeys = workTableColumnCodesSchema.keyof();

export const workTableRowUpdateSchema = workTableRowSchema
  .omit({
    id: true,
    projectLink: true,
  })
  .partial();

export type WorkTableRow = z.infer<typeof workTableRowSchema>;

export type WorkTableRowUpdate = z.infer<typeof workTableRowUpdateSchema>;

export const workTableUpdateSchema = z.record(workTableRowUpdateSchema);

export type WorkTableUpdate = z.infer<typeof workTableUpdateSchema>;
