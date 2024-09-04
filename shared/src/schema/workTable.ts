import { z } from 'zod';

import { codeListIdSchema } from './code.js';
import { nonEmptyString } from './common.js';
import { dbProjectSchema, upsertProjectSchema } from './project/base.js';
import { projectObjectUserRoleSchema } from './projectObject/base.js';
import { dbInvestmentProjectObjectSchema } from './projectObject/investment.js';

export const projectObjectYears = z.object({ year: z.number() });

export const workTableRowSchema = z.object({
  id: nonEmptyString,
  objectName: dbInvestmentProjectObjectSchema.shape.objectName,
  lifecycleState: dbInvestmentProjectObjectSchema.shape.lifecycleState,
  objectDateRange: z.object({
    startDate: dbInvestmentProjectObjectSchema.shape.startDate,
    endDate: dbInvestmentProjectObjectSchema.shape.endDate,
  }),
  projectDateRange: z.object({
    startDate: dbProjectSchema.shape.startDate,
    endDate: dbProjectSchema.shape.endDate,
  }),
  projectLink: z.object({
    projectId: dbInvestmentProjectObjectSchema.shape.projectId,
    projectName: upsertProjectSchema.shape.projectName,
    projectIndex: z.number(),
  }),
  objectType: dbInvestmentProjectObjectSchema.shape.objectType,
  objectCategory: dbInvestmentProjectObjectSchema.shape.objectCategory,
  objectUsage: dbInvestmentProjectObjectSchema.shape.objectUsage,
  operatives: z.object({
    rakennuttajaUser: dbInvestmentProjectObjectSchema.shape.rakennuttajaUser,
    suunnitteluttajaUser: dbInvestmentProjectObjectSchema.shape.suunnitteluttajaUser,
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
  sapWbsId: dbInvestmentProjectObjectSchema.shape.sapWBSId.optional(),
  sapProjectId: dbProjectSchema.shape.sapProjectId.optional(),
  companyContacts: z.array(projectObjectUserRoleSchema),
  objectRoles: z.array(projectObjectUserRoleSchema),
});

const workTableColumnKeys = workTableRowSchema.keyof().exclude(['id', 'permissionCtx']);
export type WorkTableColumn = z.infer<typeof workTableColumnKeys>;
const reportTemplate = z.enum(['print', 'basic', 'expences', 'roles']);

export const workTableSearchSchema = z.object({
  projectName: z.string().optional(),
  projectObjectName: z.string().optional(),
  objectStartDate: dbInvestmentProjectObjectSchema.shape.startDate.optional().nullable(),
  objectEndDate: dbInvestmentProjectObjectSchema.shape.endDate.optional().nullable(),
  objectType: dbInvestmentProjectObjectSchema.shape.objectType.optional(),
  objectCategory: dbInvestmentProjectObjectSchema.shape.objectCategory.optional(),
  objectUsage: dbInvestmentProjectObjectSchema.shape.objectUsage.optional(),
  lifecycleState: z.array(dbInvestmentProjectObjectSchema.shape.lifecycleState).optional(),
  objectStage: z.array(dbInvestmentProjectObjectSchema.shape.objectStage).optional(),
  objectParticipantUser: nonEmptyString.optional(),
  reportTemplate: reportTemplate.optional(),
  rakennuttajaUser: z.array(nonEmptyString).optional(),
  suunnitteluttajaUser: z.array(nonEmptyString).optional(),
  company: z.array(nonEmptyString).optional(),
});

export type WorkTableSearch = z.infer<typeof workTableSearchSchema>;

export const workTableColumnCodesSchema = z.object({
  lifecycleState: codeListIdSchema.extract(['KohteenElinkaarentila']),
  objectType: codeListIdSchema.extract(['KohdeTyyppi']),
  objectCategory: codeListIdSchema.extract(['KohteenOmaisuusLuokka']),
  objectUsage: codeListIdSchema.extract(['KohteenToiminnallinenKayttoTarkoitus']),
  objectRoles: codeListIdSchema.extract(['KohdeKayttajaRooli']),
});

export const workTableColumnCodes = workTableColumnCodesSchema.parse({
  lifecycleState: 'KohteenElinkaarentila',
  objectType: 'KohdeTyyppi',
  objectCategory: 'KohteenOmaisuusLuokka',
  objectUsage: 'KohteenToiminnallinenKayttoTarkoitus',
  objectRoles: 'KohdeKayttajaRooli',
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

export type ReportTemplate = z.infer<typeof reportTemplate>;

export const templateColumns: Record<ReportTemplate, WorkTableColumn[]> = {
  print: [
    'projectLink',
    'objectName',
    'lifecycleState',
    'objectDateRange',
    'objectType',
    'objectCategory',
    'objectUsage',
    'operatives',
    'budget',
    'actual',
    'forecast',
    'kayttosuunnitelmanMuutos',
    'sapProjectId',
    'sapWbsId',
  ],
  basic: [
    'projectLink',
    'projectDateRange',
    'sapProjectId',
    'objectName',
    'objectDateRange',
    'sapWbsId',
    'operatives',
  ],
  expences: [
    'projectLink',
    'projectDateRange',
    'sapProjectId',
    'objectName',
    'objectDateRange',
    'sapWbsId',
    'operatives',
    'budget',
    'actual',
    'forecast',
    'kayttosuunnitelmanMuutos',
    'companyContacts',
  ],
  roles: ['projectLink', 'objectName', 'objectDateRange', 'objectRoles'],
} as const;
