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
    createdAt: handleSapDate(payload.ERDAT),
    createdBy: payload.ERNAM,
    updatedAt: handleSapDate(payload.AEDAT),
    updatedBy: payload.AENAM,
    projectManagerName: payload.VERNA,
    applicantName: payload.ASTNA,
    plannedStartDate: handleSapDate(payload.PLFAZ),
    plannedEndDate: handleSapDate(payload.PLSEZ),
    plant: payload.WERKS,
    wbs: payload.WBS.map((wbs) => {
      return {
        wbsId: wbs.POSID,
        wbsInternalId: wbs.PSPNR,
        sapProjectInternalId: wbs.PSPHI,
        shortDescription: wbs.POST1,
        createdAt: handleSapDate(wbs.ERDAT),
        createdBy: wbs.ERNAM,
        updatedAt: handleSapDate(wbs.AEDAT),
        updatedBy: wbs.AENAM,
        applicantName: wbs.ASTNA,
        requestingCostCenter: wbs.AKSTL,
        responsibleCostCenter: wbs.FKSTL,
        projectType: wbs.PRART,
        priority: wbs.PSPRI,
        plant: wbs.WERKS,
        technicallyCompletedAt: handleSapDate(wbs.TADAT),
        reasonForInvestment: wbs.IZWEK,
        reasonForEnvironmentalInvestment: wbs.IUMKZ,
        hierarchyLevel: parseInt(wbs.STUFE, 10),
        network: wbs?.NETWORK
          ? {
              networkId: wbs.NETWORK.AUFNR,
              networkName: wbs.NETWORK.KTEXT,
              wbsInternalId: wbs.NETWORK.PSPEL,
              sapProjectInternalId: wbs.NETWORK.PSPHI,
              createdAt: handleSapDate(wbs.NETWORK.ERDAT),
              createdBy: wbs.NETWORK.ERNAM,
              actualStartDate: handleSapDate(wbs.NETWORK.GSTRI),
              actualFinishDate: handleSapDate(wbs.NETWORK.GETRI),
              companyCode: wbs.NETWORK.BUKRS,
              plant: wbs.NETWORK.WERKS,
              technicalCompletionDate: handleSapDate(wbs.NETWORK.IDAT2),
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
            }
          : null,
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
  let result = parseInt(whole, 10) * 100;
  if (fraction) {
    result += parseInt(fraction, 10);
  }
  return result;
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
      documentDate: handleSapDate(item.BLDAT),
      postingDate: handleSapDate(item.BUDAT),
      creationDate: handleSapDate(item.CPUDT),
      objectType: item.OBART,
      currency: item.TWAER,
      valueInCurrencySubunit: currencyInSubunit(item.WTGBTR),
      entryType: item.BEKNZ === 'S' ? 'DEBIT' : 'CREDIT',
    };
  });

  return sapActualsSchema.parse(result);
}
