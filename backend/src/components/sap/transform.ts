import { z } from 'zod';

import {
  incomingItemSchema,
  incomingSapActualsSchema,
  sapActualsSchema,
} from '@shared/schema/sapActuals';
import { incomingSapProjectSchema, sapProjectSchema } from '@shared/schema/sapProject';

function itemAsArray<T>(item: T | T[]) {
  if (item && Array.isArray(item)) {
    return item;
  } else if (item && !Array.isArray(item)) {
    return [item];
  } else {
    return [];
  }
}

function transformNetwork(network: any) {
  const networkItem = network?.item;
  if (!networkItem) {
    return null;
  }
  return {
    ...networkItem,
    ACTIVITY: itemAsArray(networkItem?.ACTIVITY?.item),
  } as const;
}

function transformWBS(wbs: any) {
  const wbsItems = itemAsArray(wbs?.item);
  return wbsItems.map((item: any) => {
    return {
      ...item,
      NETWORK: transformNetwork(item?.NETWORK),
    } as const;
  });
}

function preprocessProjectInfo(payload: any) {
  if (!payload.PROJECT_INFO) {
    throw new Error('No PROJECT_INFO in payload');
  }

  const data = {
    ...payload.PROJECT_INFO,
    WBS: transformWBS(payload.PROJECT_INFO.WBS),
  } as const;

  return incomingSapProjectSchema.parse(data);
}

function handleSapDate(date?: string | null) {
  if (date && date === '0000-00-00') {
    return null;
  }
  return date;
}

export function transformProjectInfo(response: object) {
  const payload = preprocessProjectInfo(response);
  const transformed = {
    sapProjectId: payload.PSPID,
    sapProjectInternalId: payload.PSPNR,
    shortDescription: payload.POST1,
    createdAt: payload.ERDAT,
    createdBy: payload.ERNAM,
    updatedAt: payload.AEDAT,
    updatedBy: payload.AENAM,
    projectManagerName: payload.VERNA,
    applicantName: payload.ASTNA,
    plannedStartDate: payload.PLFAZ,
    plannedEndDate: payload.PLSEZ,
    plant: payload.WERKS,
    wbs: payload.WBS.map((wbs) => {
      return {
        wbsId: wbs.POSID,
        wbsInternalId: wbs.PSPNR,
        sapProjectInternalId: wbs.PSPHI,
        shortDescription: wbs.POST1,
        createdAt: wbs.ERDAT,
        createdBy: wbs.ERNAM,
        updatedAt: wbs.AEDAT,
        updatedBy: wbs.AENAM,
        applicantName: wbs.ASTNA,
        requestingCostCenter: wbs.AKSTL,
        responsibleCostCenter: wbs.FKSTL,
        projectType: wbs.PRART,
        priority: wbs.PSPRI,
        plant: wbs.WERKS,
        technicallyCompletedAt: wbs.TADAT,
        reasonForInvestment: wbs.IZWEK,
        reasonForEnvironmentalInvestment: wbs.IUMKZ,
        hierarchyLevel: parseInt(wbs.STUFE, 10),
        network: {
          networkId: wbs.NETWORK.AUFNR,
          networkName: wbs.NETWORK.KTEXT,
          wbsInternalId: wbs.NETWORK.PSPEL,
          sapProjectInternalId: wbs.NETWORK.PSPHI,
          createdAt: wbs.NETWORK.ERDAT,
          createdBy: wbs.NETWORK.ERNAM,
          actualStartDate: handleSapDate(wbs.NETWORK.GSTRI),
          actualFinishDate: handleSapDate(wbs.NETWORK.GETRI),
          companyCode: wbs.NETWORK.BUKRS,
          plant: wbs.NETWORK.WERKS,
          technicalCompletionDate: wbs.NETWORK.IDAT2,
          profitCenter: wbs.NETWORK.PRCTR,
          activities: wbs.NETWORK.ACTIVITY.map((activity) => {
            return {
              routingNumber: activity.AUFPL,
              orderCounter: activity.APLZL,
              activityNumber: activity.VORNR,
              networkId: activity.AUFNR,
              shortDescription: activity.LTXA1,
              sapProjectInternalId: activity.PSPHI,
              wbsInternalId: activity.PSPEL,
              profitCenter: activity.PRCTR,
              plant: activity.WERKS,
            };
          }),
        },
      };
    }),
  };

  return sapProjectSchema.parse(transformed);
}

const wsActualsResultSchema = z.object({
  ACTUALS: z
    .object({
      item: z.array(incomingItemSchema).nullish(),
    })
    .nullish(),
});

function preprocessActuals(payload: object) {
  const result = wsActualsResultSchema.parse(payload);
  return incomingSapActualsSchema.parse(result.ACTUALS?.item ?? []);
}

function currencyInSubunit(amount: string, separator = '.') {
  const [whole, fraction] = amount.split(separator);
  return parseInt(whole, 10) * 100 + parseInt(fraction, 10);
}

export function transformActuals(response: object) {
  const actuals = preprocessActuals(response);

  const result = actuals.map((item) => {
    return {
      documentNumber: item.BELNR,
      description: item.OBJ_TXT,
      sapProjectId: item.PSPID,
      wbsElementId: item.POSID,
      networkId: item.AUFNR,
      activityId: item.VORNR,
      fiscalYear: item.GJAHR,
      documentDate: item.BLDAT,
      postingDate: item.BUDAT,
      creationDate: item.CPUDT,
      objectType: item.OBART,
      currency: item.TWAER,
      valueInCurrencySubunit: currencyInSubunit(item.WTGBTR),
      entryType: item.BEKNZ === 'S' ? 'DEBIT' : 'CREDIT',
    };
  });

  return sapActualsSchema.parse(result);
}
