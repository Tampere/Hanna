import { z } from 'zod';

import { codeId } from './code.js';
import { isoDateString, nonEmptyString } from './common.js';

/**
 * Request to the finance department to create a SAP project (hanke) or WBS element (kohde).
 *
 * Storage rules:
 * - Values prefilled from existing hanke/kohde fields are written back to them when changed,
 *   with the same validation as the normal forms.
 * - User pick fields (vastuuhenkilö) default to the current user and are stored only on the
 *   request - they never change existing Hanna data.
 * - Fields without a Hanna column are stored only on the request (`request_data`).
 */

/** End date may be 'infinity' for ongoing maintenance projects/objects, like in the forms. */
export const endDateSchema = z.union([isoDateString, z.literal('infinity')]);

/** Hanke request (Figma 6277-553). startDate and endDate are written to the project. */
export const projectSapIdentifierRequestSchema = z.object({
  projectId: nonEmptyString,
  startDate: isoDateString,
  endDate: endDateSchema,
  // request_data only
  responsiblePerson: nonEmptyString,
  serviceClasses: z.array(codeId),
});

/**
 * Kohde request (Figma 6287-535). startDate, endDate and environmentalInvestmentReason are
 * written to the project object.
 */
export const projectObjectSapIdentifierRequestSchema = z.object({
  projectId: nonEmptyString,
  projectObjectId: nonEmptyString,
  startDate: isoDateString,
  endDate: endDateSchema,
  environmentalInvestmentReason: codeId.nullable(),
  // request_data only
  responsiblePerson: nonEmptyString,
  costCenterId: nonEmptyString,
  /** Kohteen luokka: Hankeluokka codes, prefilled from the kohde type. */
  projectObjectClass: codeId,
});

export type ProjectSapIdentifierRequest = z.infer<typeof projectSapIdentifierRequestSchema>;
export type ProjectObjectSapIdentifierRequest = z.infer<
  typeof projectObjectSapIdentifierRequestSchema
>;

/** Shape of the `request_data` column. */
export const sapIdentifierRequestDataSchema = z.object({
  serviceClasses: z.array(codeId).optional(),
  responsiblePerson: z.string().optional(),
  costCenterId: z.string().optional(),
  projectObjectClass: codeId.optional(),
});

export type SapIdentifierRequestData = z.infer<typeof sapIdentifierRequestDataSchema>;

export const sapIdentifierTargetSchema = z.object({
  projectId: nonEmptyString,
  projectObjectId: nonEmptyString.optional().nullable(),
});

export type SapIdentifierTarget = z.infer<typeof sapIdentifierTargetSchema>;

/** Status shown in the header and Kuluseuranta tab. */
export const sapIdentifierStatusSchema = z.object({
  /** sap_project_id for a hanke, sap_wbs_id for a kohde */
  identifier: z.string().nullable(),
  /** Parent hanke's sap_project_id - a kohde can be requested only when this is set */
  parentProjectSapId: z.string().nullable(),
  openRequest: z
    .object({
      id: z.string(),
      requestedBy: z.object({ id: z.string(), name: z.string() }),
      requestedAt: z.date(),
    })
    .nullable(),
});

export type SapIdentifierStatus = z.infer<typeof sapIdentifierStatusSchema>;

/** Data for the finance link page (Figma 6248-311). */
export const sapIdentifierFinanceViewSchema = sapIdentifierStatusSchema.extend({
  title: z.string(),
  isProjectObject: z.boolean(),
  projectType: z.enum(['investmentProject', 'maintenanceProject']),
});

export type SapIdentifierFinanceView = z.infer<typeof sapIdentifierFinanceViewSchema>;

export const setSapIdentifierSchema = sapIdentifierTargetSchema.extend({
  identifier: nonEmptyString,
});

export type SetSapIdentifier = z.infer<typeof setSapIdentifierSchema>;

export const setSapIdentifierResultSchema = z.object({
  identifier: z.string(),
  /** Set when the identifier was not found in synced SAP data. Saving is not blocked. */
  warning: z.enum(['sapProjectNotFound', 'sapWbsNotFound', 'sapLookupFailed']).nullable(),
});

export type SetSapIdentifierResult = z.infer<typeof setSapIdentifierResultSchema>;

/** Prefilled values for the request dialogs. */
export const sapIdentifierRequestDefaultsSchema = z.object({
  title: z.string(),
  projectType: z.enum(['investmentProject', 'maintenanceProject']),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  environmentalInvestmentReason: z.string().nullable(),
  /** Kohde only: 30 Laajennus for Uudisrakentaminen, otherwise 10 Korvaus. */
  projectObjectClass: z.string().nullable(),
});

export type SapIdentifierRequestDefaults = z.infer<typeof sapIdentifierRequestDefaultsSchema>;

export const costCenterOptionSchema = z.object({ id: z.string(), name: z.string() });

export type CostCenterOption = z.infer<typeof costCenterOptionSchema>;
