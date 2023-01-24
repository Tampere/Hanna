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
  WERKS: z.string(),
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
  WERKS: z.string(),
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
  ASTNA: z.string(),
  AKSTL: z.string().nullish(),
  FKSTL: z.string().nullish(),
  PRART: z.string(),
  PSPRI: z.string(),
  WERKS: z.string(),
  TADAT: isoDateString.nullish(),
  IZWEK: z.string(),
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
  AENAM: z.string(),
  VERNA: z.string(),
  ASTNA: z.string(),
  PLFAZ: isoDateString.nullish(),
  PLSEZ: isoDateString.nullish(),
  WERKS: z.string(),
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
  plant: z.string(),
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
  plant: z.string(),
  technicalCompletionDate: isoDateString,
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
  applicantName: z.string(),
  requestingCostCenter: z.string(),
  responsibleCostCenter: z.string(),
  projectType: z.string(),
  priority: z.string(),
  plant: z.string(),
  technicallyCompletedAt: isoDateString,
  reasonForInvestment: z.string(),
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
  updatedAt: isoDateString,
  updatedBy: z.string(),
  projectManagerName: z.string(),
  applicantName: z.string(),
  plannedStartDate: isoDateString,
  plannedEndDate: isoDateString,
  plant: z.string(),
  wbs: z.array(sapWBSSchema),
});

export type SAPProject = z.infer<typeof sapProjectSchema>;
