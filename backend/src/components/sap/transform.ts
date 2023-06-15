import { z } from 'zod';

import {
  incomingItemSchema,
  incomingSapActualsSchema,
  sapActualsSchema,
} from '@shared/schema/sapActuals';
import {
  SAPActivity,
  SAPNetwork,
  SAPProject,
  SAPWBS,
  incomingSapProjectSchema,
  sapProjectSchema,
} from '@shared/schema/sapProject';

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
  const networkItems = itemAsArray(network?.item);
  return networkItems.map((networkItem) => ({
    ...networkItem,
    ACTIVITY: itemAsArray(networkItem?.ACTIVITY?.item),
  }));
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
  const item = payload.PROJECT_INFO?.item;
  if (!item) {
    return null;
  }

  const data = {
    ...item,
    WBS: transformWBS(item.WBS),
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
  if (!payload) {
    return null;
  }
  const transformed: SAPProject = {
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
    wbs: payload.WBS.map((wbs): SAPWBS => {
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
        consultCompany: wbs.USR00,
        blanketOrderId: wbs.USR01,
        decisionMaker: wbs.USR02,
        decisionDateText: wbs.USR03,
        // For some reason the price in this field is shifted compared to other numeric currency fields
        contractPriceInCurrencySubunit:
          wbs.USR06 == null ? null : numericStringToInteger(wbs.USR06, { decimals: 3 }),
        technicallyCompletedAt: handleSapDate(wbs.TADAT),
        reasonForInvestment: wbs.IZWEK,
        reasonForEnvironmentalInvestment: wbs.IUMKZ,
        hierarchyLevel: parseInt(wbs.STUFE, 10),
        network:
          wbs?.NETWORK?.map(
            (network): SAPNetwork => ({
              networkId: network.AUFNR,
              networkName: network.KTEXT,
              wbsInternalId: network.PSPEL,
              sapProjectInternalId: network.PSPHI,
              createdAt: handleSapDate(network.ERDAT),
              createdBy: network.ERNAM,
              actualStartDate: handleSapDate(network.GSTRI),
              actualFinishDate: handleSapDate(network.GETRI),
              companyCode: network.BUKRS,
              plant: network.WERKS,
              technicalCompletionDate: handleSapDate(network.IDAT2),
              profitCenter: network.PRCTR,
              activities: network.ACTIVITY.map((activity): SAPActivity => {
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
            })
          ) ?? [],
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

function numericStringToInteger(value: string, config?: { separator?: string; decimals?: number }) {
  const { separator = '.', decimals = 2 } = config ?? {};
  const [whole, fraction] = value.split(separator);
  // Truncate & normalize the fraction part
  const truncatedFraction = fraction?.slice(0, decimals) ?? '';
  // Concatenate the whole & zero-padded fraction part as a string and parse as an integer
  return parseInt(`${whole}${truncatedFraction.padEnd(decimals, '0')}`);
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
      valueInCurrencySubunit: numericStringToInteger(item.WTGBTR),
      entryType: item.BEKNZ === 'S' ? 'DEBIT' : 'CREDIT',
    };
  });

  return sapActualsSchema.parse(result);
}
