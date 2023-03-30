import { z } from 'zod';

import { isoDateString } from './common';

/**
 * Incoming SAP objects
 */

export const incomingActivitySchema = z.object({
  AUFPL: z.string(),
  APLZL: z.string(),
  VORNR: z.string(),
  AUFNR: z.string(),
  LTXA1: z.string(),
  PSPHI: z.string(),
  PSPEL: z.string(),
  PRCTR: z.string(),
  WERKS: z.string().nullish(),
});

export type IncomingActivity = z.infer<typeof incomingActivitySchema>;

export const incomingNetworkSchema = z.object({
  AUFNR: z.string(),
  KTEXT: z.string(),
  PSPEL: z.string(),
  PSPHI: z.string(),
  ERDAT: isoDateString,
  ERNAM: z.string(),
  GSTRI: isoDateString.nullish(),
  GETRI: isoDateString.nullish(),
  BUKRS: z.string(),
  WERKS: z.string().nullish(),
  IDAT2: isoDateString.nullish(),
  PRCTR: z.string().nullish(),
  ACTIVITY: z.array(incomingActivitySchema),
});

export type IncomingNetwork = z.infer<typeof incomingNetworkSchema>;

export const incomingWBSSchema = z.object({
  POSID: z.string(),
  PSPNR: z.string(),
  PSPHI: z.string(),
  POST1: z.string(),
  ERDAT: isoDateString,
  ERNAM: z.string(),
  AEDAT: isoDateString.nullish(),
  AENAM: z.string().nullish(),
  ASTNA: z.string().nullish(),
  AKSTL: z.string().nullish(),
  FKSTL: z.string().nullish(),
  PRART: z.string().nullish(),
  PSPRI: z.string().nullish(),
  WERKS: z.string().nullish(),
  TADAT: isoDateString.nullish(),
  IZWEK: z.string().nullish(),
  IUMKZ: z.string().nullish(),
  STUFE: z.string(),
  NETWORK: incomingNetworkSchema.nullish(),
});

export type IncomingWBS = z.infer<typeof incomingWBSSchema>;

export const incomingSapProjectSchema = z.object({
  PSPID: z.string(),
  PSPNR: z.string(),
  POST1: z.string(),
  ERDAT: isoDateString,
  ERNAM: z.string(),
  AEDAT: isoDateString.nullish(),
  AENAM: z.string().nullish(),
  VERNA: z.string().nullish(),
  ASTNA: z.string().nullish(),
  PLFAZ: isoDateString.nullish(),
  PLSEZ: isoDateString.nullish(),
  WERKS: z.string().nullish(),
  WBS: z.array(incomingWBSSchema),
});

export type IncomingSAPProject = z.infer<typeof incomingSapProjectSchema>;

/**
 * Application representation of SAP objects
 */

export const sapActivity = z.object({
  routingNumber: z.string(),
  orderCounter: z.string(),
  activityNumber: z.string(),
  networkId: z.string(),
  shortDescription: z.string(),
  sapProjectInternalId: z.string(),
  wbsInternalId: z.string(),
  profitCenter: z.string(),
  plant: z.string().nullish(),
});

export type SAPActivity = z.infer<typeof sapActivity>;

export const sapNetworkSchema = z.object({
  networkId: z.string(),
  networkName: z.string(),
  wbsInternalId: z.string(),
  sapProjectInternalId: z.string(),
  createdAt: isoDateString,
  createdBy: z.string(),
  actualStartDate: isoDateString.nullish(),
  actualFinishDate: isoDateString.nullish(),
  companyCode: z.string(),
  plant: z.string().nullish(),
  technicalCompletionDate: isoDateString.nullish(),
  profitCenter: z.string().nullish(),
  activities: z.array(sapActivity),
});

export type SAPNetwork = z.infer<typeof sapNetworkSchema>;

export const sapWBSSchema = z.object({
  wbsId: z.string(),
  wbsInternalId: z.string(),
  sapProjectInternalId: z.string(),
  shortDescription: z.string(),
  createdAt: isoDateString,
  createdBy: z.string(),
  updatedAt: isoDateString.nullish(),
  updatedBy: z.string().nullish(),
  applicantName: z.string().nullish(),
  requestingCostCenter: z.string().nullish(),
  responsibleCostCenter: z.string().nullish(),
  projectType: z.string().nullish(),
  priority: z.string().nullish(),
  plant: z.string().nullish(),
  technicallyCompletedAt: isoDateString.nullish(),
  reasonForInvestment: z.string().nullish(),
  reasonForEnvironmentalInvestment: z.string().nullish(),
  hierarchyLevel: z.number(),
  network: sapNetworkSchema.nullish(),
});

export type SAPWBS = z.infer<typeof sapWBSSchema>;

export const sapProjectSchema = z.object({
  sapProjectId: z.string(),
  sapProjectInternalId: z.string(),
  shortDescription: z.string(),
  createdAt: isoDateString,
  createdBy: z.string(),
  updatedAt: isoDateString.nullish(),
  updatedBy: z.string().nullish(),
  projectManagerName: z.string().nullish(),
  applicantName: z.string().nullish(),
  plannedStartDate: isoDateString.nullish(),
  plannedEndDate: isoDateString.nullish(),
  plant: z.string().nullish(),
  wbs: z.array(sapWBSSchema),
});

export type SAPProject = z.infer<typeof sapProjectSchema>;
