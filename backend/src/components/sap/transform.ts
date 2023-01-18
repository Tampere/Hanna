import { incomingSapActualsSchema } from '@shared/schema/sapActuals';
import { incomingSapProjectSchema, sapProjectSchema } from '@shared/schema/sapProject';

function itemAsArray(item: any) {
  if (item && !Array.isArray(item)) {
    return [item];
  } else if (item) {
    return item;
  } else {
    return [];
  }
}

function transformNetwork(network: any) {
  const networkItem = network.item;
  return {
    ...networkItem,
    ACTIVITY: itemAsArray(networkItem.ACTIVITY.item),
  } as const;
}

function transformWBS(wbs: any) {
  if (!wbs) {
    return [];
  }

  const wbsItems = itemAsArray(wbs.item);
  return wbsItems.map((item: any) => {
    return {
      ...item,
      NETWORK: transformNetwork(item.NETWORK),
    } as const;
  });
}

function preprocessProjectInfo(payload: any) {
  const projectInfo = payload?.[0].PROJECT_INFO;

  if (!projectInfo) {
    throw new Error('Project info not found');
  }

  const data = {
    ...projectInfo,
    WBS: transformWBS(projectInfo.WBS),
  } as const;
  return incomingSapProjectSchema.parse(data);
}

export function transformProjectInfo(response: any) {
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
        sapProjectInternalID: wbs.PSPHI,
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
          sapWBSInternalId: wbs.NETWORK.PSPEL,
          sapProjectInternalId: wbs.NETWORK.PSPHI,
          createdAt: wbs.NETWORK.ERDAT,
          createdBy: wbs.NETWORK.ERNAM,
          actualStartDate: wbs.NETWORK.GSTRI,
          actualFinishDate: wbs.NETWORK.GETRI,
          companyCode: wbs.NETWORK.BUKRS,
          plant: wbs.NETWORK.WERKS,
          technicalCompletionDate: wbs.NETWORK.IDAT2,
          profitCenter: wbs.NETWORK.PRCTR,
          activities: wbs.NETWORK.ACTIVITY.map((activity: any) => {
            return {
              routingNumber: activity.AUFPL,
              orderCounter: activity.APLZL,
              activityNumber: activity.VORNR,
              networkId: activity.AUFNR,
              shortDescription: activity.LTXA1,
              sapProjectInternalId: activity.PSPHI,
              sapWBSInternalId: activity.PSPEL,
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

function preprocessActuals(payload: any) {
  const actuals = payload?.[0].ACTUALS.item;

  if (!actuals) {
    throw new Error('Actuals not found');
  }

  return incomingSapActualsSchema.parse(actuals);
}

function currencyInSubunit(amount: string, separator = '.') {
  const [whole, fraction] = amount.split(separator);
  return parseInt(whole, 10) * 100 + parseInt(fraction, 10);
}

export function transformActuals(response: any) {
  const actuals = preprocessActuals(response);

  return actuals.map((item) => {
    return {
      documentNumber: item.BELNR,
      description: item.OBJ_TXT,
      projectId: item.PSPID,
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
}
