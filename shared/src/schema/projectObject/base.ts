import { z } from 'zod';

import { codeId, codeListIdSchema } from '../code.js';
import { isoDateString, nonEmptyString } from '../common.js';

export const projectObjectUserRoleSchema = z.object({
  roleId: codeId,
  roleType: codeListIdSchema.extract(['KohdeKayttajaRooli', 'InvestointiKohdeKayttajaRooli']),
  userIds: z.array(nonEmptyString),
  companyContactIds: z.array(nonEmptyString),
});

const baseBudgetItemSchema = z.object({
  year: z.number(),
  estimate: z.number().nullable(),
  contractPrice: z.number().nullable(),
  amount: z.number().nullable(),
  forecast: z.number().nullable(),
  kayttosuunnitelmanMuutos: z.number().nullable(),
});

export const updateInvestmentBudgetSchema = z.object({
  projectObjectId: z.string().optional(),
  budgetItems: z.array(
    baseBudgetItemSchema.partial().extend({ year: z.number(), committee: z.string() }).strict(),
  ),
});

export const updateMaintenanceBudgetSchema = z.object({
  projectObjectId: z.string().optional(),
  budgetItems: z.array(
    baseBudgetItemSchema.partial().extend({ year: z.number(), committee: z.null() }).strict(),
  ),
});

export const updateBudgetSchema = z.union([
  updateInvestmentBudgetSchema,
  updateMaintenanceBudgetSchema,
]);

export const updateInvestmentBudgetFinancialWriterSchema = updateInvestmentBudgetSchema
  .pick({
    projectObjectId: true,
  })
  .required()
  .extend({
    budgetItems: z.array(
      baseBudgetItemSchema
        .partial()
        .pick({ amount: true, kayttosuunnitelmanMuutos: true })
        .extend({ year: z.number(), committee: z.string() })
        .strict(),
    ),
  });

export const updateMaintenanceBudgetFinancialWriterSchema = updateMaintenanceBudgetSchema
  .pick({
    projectObjectId: true,
  })
  .required()
  .extend({
    budgetItems: z.array(
      baseBudgetItemSchema
        .partial()
        .pick({ amount: true, kayttosuunnitelmanMuutos: true })
        .extend({ year: z.number(), committee: z.null() })
        .strict(),
    ),
  });

export const updateInvestmentBudgetOwnerWriterSchema = updateInvestmentBudgetSchema
  .pick({
    projectObjectId: true,
  })
  .required()
  .extend({
    budgetItems: z.array(
      baseBudgetItemSchema
        .partial()
        .omit({
          amount: true,
          kayttosuunnitelmanMuutos: true,
        })
        .extend({ year: z.number(), committee: z.string() })
        .strict(),
    ),
  });

export const updateMaintenanceBudgetOwnerWriterSchema = updateMaintenanceBudgetSchema
  .pick({
    projectObjectId: true,
  })
  .required()
  .extend({
    budgetItems: z.array(
      baseBudgetItemSchema
        .partial()
        .omit({
          amount: true,
          kayttosuunnitelmanMuutos: true,
        })
        .extend({ year: z.number(), committee: z.null() })
        .strict(),
    ),
  });

export const newProjectObjectSchema = z.object({
  // id here as well since zodResolver in the form hook does not send the id if not in this schema
  projectObjectId: z.string().optional().nullable(),
  projectId: z.string(),
  objectName: nonEmptyString,
  description: nonEmptyString,
  lifecycleState: codeId,
  objectCategory: z.array(codeId).superRefine((value) => value.length > 0),
  objectUsage: z.array(codeId).superRefine((value) => value.length > 0),
  startDate: isoDateString,
  endDate: isoDateString,
  sapWBSId: nonEmptyString.optional().nullable(),
  landownership: codeId.optional().nullable(),
  locationOnProperty: codeId.optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  objectUserRoles: z.array(projectObjectUserRoleSchema),
  geom: z.string().optional().nullable(),
  budgetUpdate: updateBudgetSchema.optional().nullable(),
});

export const commonDbProjectObjectSchema = newProjectObjectSchema.extend({
  projectObjectId: z.string(),
  geom: z.string().nullable(),
  geometryDump: z.array(z.string()).nullish(),
  createdAt: isoDateString,
  deleted: z.boolean(),
  updatedBy: z.string(),
  permissionCtx: z.object({
    writeUsers: z.array(nonEmptyString),
    owner: nonEmptyString,
  }),
});

export type CommonDbProjectObject = z.infer<typeof commonDbProjectObjectSchema>;

export const getProjectObjectParams = z.object({
  projectId: z.string(),
  projectObjectId: z.string(),
});

export type ProjectObjectParams = z.infer<typeof getProjectObjectParams>;

export const updateGeometrySchema = z.object({
  projectObjectId: z.string(),
  features: z.string(),
});
export type UpdateGeometry = z.infer<typeof updateGeometrySchema>;

export const updateGeometryResultSchema = z.object({
  projectObjectId: z.string(),
  geom: z.string(),
});

export const deleteProjectObjectSchema = z.object({
  projectObjectId: z.string(),
});

export type UpdateGeometryResult = z.infer<typeof updateGeometryResultSchema>;

export const yearBudgetSchema = z.object({
  year: z.number(),
  budgetItems: z.object({
    estimate: z.number().nullable(),
    contractPrice: z.number().nullable(),
    amount: z.number().nullable(),
    forecast: z.number().nullable(),
    kayttosuunnitelmanMuutos: z.number().nullable(),
  }),
  committee: z.string().nullable(),
});

export type YearBudget = z.infer<typeof yearBudgetSchema>;

export type BudgetUpdate = z.infer<typeof updateBudgetSchema>;

export type ProjectObjectUserRole = z.infer<typeof projectObjectUserRoleSchema>;
