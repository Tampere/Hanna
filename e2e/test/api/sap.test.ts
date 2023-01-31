import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

test.describe('Project endpoints', () => {
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('SAP project import without WBS', async () => {
    const res = await client.sap.getSapProject.mutate({
      projectId: 'A1111_00000',
    });
    // NOTE: Full set of fields checked in 2 WBS / 2 Activities test. This checks the empty
    // WBS case for correct structure
    expect(res).toMatchObject({
      sapProjectId: 'A1111_00000',
      wbs: [],
    });
  });

  test('SAP project import with one WBS and one activity per WBS', async () => {
    const res = await client.sap.getSapProject.mutate({
      projectId: 'A1111_11000',
    });

    // NOTE: Full set of fields checked in 2 WBS / 2 Activities test. This checks the
    // single WBS / single activity case for correct structure
    expect(res).toMatchObject({
      sapProjectId: 'A1111_11000',
      wbs: [
        {
          wbsId: 'A1111_110000',
          network: {
            networkId: '000090661291',
            activities: [{ activityNumber: '8196' }],
          },
        },
      ],
    });
  });

  test('SAP project import with two WBS and two activities per WBS', async () => {
    const res = await client.sap.getSapProject.mutate({
      projectId: 'A1111_22000',
    });

    expect(res).toStrictEqual({
      sapProjectId: 'A1111_22000',
      sapProjectInternalId: '00019987',
      shortDescription: 'Keskusta, investointihanke',
      createdAt: '2020-03-26',
      createdBy: 'MATTINIE',
      updatedAt: '2020-05-21',
      updatedBy: 'MATTINIE',
      projectManagerName: 'Nieminen Matti',
      applicantName: 'Nieminen Matti',
      plannedStartDate: '2020-03-27',
      plannedEndDate: '2024-05-17',
      plant: '1111',
      wbs: [
        {
          wbsId: 'A1111_220000',
          wbsInternalId: '00613447',
          sapProjectInternalId: '00019987',
          shortDescription: 'Keskusta, investointihanke, kohde 1',
          createdAt: '2020-03-31',
          createdBy: 'MATTIMÄK',
          updatedAt: '2020-04-10',
          updatedBy: 'MATTINIE',
          applicantName: 'Nieminen Matti',
          requestingCostCenter: '00280254',
          responsibleCostCenter: '00280254',
          projectType: 'Y4',
          priority: 'U',
          plant: '1111',
          technicallyCompletedAt: '2021-06-26',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: {
            networkId: '000070221268',
            networkName: 'Keskusta, investointihanke',
            wbsInternalId: '00613447',
            sapProjectInternalId: '00019987',
            createdAt: '2020-04-22',
            createdBy: 'LIISANIE',
            actualStartDate: '2023-07-21',
            actualFinishDate: null,
            companyCode: '1793',
            plant: '1111',
            technicalCompletionDate: '2023-12-03',
            profitCenter: '0000672283',
            activities: [
              {
                plant: '1111',
                networkId: '000070221268',
                orderCounter: '00000001',
                profitCenter: '0000672283',
                routingNumber: '0000012960',
                wbsInternalId: '00613447',
                activityNumber: '0913',
                shortDescription: 'Lisätyö',
                sapProjectInternalId: '00019987',
              },
              {
                plant: '1111',
                networkId: '000070221268',
                orderCounter: '00000002',
                profitCenter: '0000672283',
                routingNumber: '0000012960',
                wbsInternalId: '00613447',
                activityNumber: '8111',
                shortDescription: 'Ylläpito',
                sapProjectInternalId: '00019987',
              },
            ],
          },
        },
        {
          wbsId: 'A1111_220001',
          wbsInternalId: '00010521',
          sapProjectInternalId: '00019987',
          shortDescription: 'Keskusta, investointihanke, kohde 2',
          createdAt: '2020-03-31',
          createdBy: 'MATTIMÄK',
          updatedAt: '2020-04-10',
          updatedBy: 'LIISANIE',
          applicantName: 'Nieminen Matti',
          requestingCostCenter: '00280254',
          responsibleCostCenter: '00280254',
          projectType: 'Y4',
          priority: 'U',
          plant: '1111',
          technicallyCompletedAt: '2021-06-26',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: {
            networkId: '000059222049',
            networkName: 'Keskusta, investointihanke',
            wbsInternalId: '00010521',
            sapProjectInternalId: '00019987',
            createdAt: '2020-04-20',
            createdBy: 'LIISANIE',
            actualStartDate: '2020-05-20',
            actualFinishDate: null,
            companyCode: '1793',
            plant: '1111',
            technicalCompletionDate: '2020-11-27',
            profitCenter: '0000578685',
            activities: [
              {
                plant: '1111',
                networkId: '000059222049',
                orderCounter: '00000001',
                profitCenter: '0000578685',
                routingNumber: '0000052080',
                wbsInternalId: '00010521',
                activityNumber: '0681',
                shortDescription: 'Rakentaminen',
                sapProjectInternalId: '00019987',
              },
              {
                plant: '1111',
                networkId: '000059222049',
                orderCounter: '00000002',
                profitCenter: '0000578685',
                routingNumber: '0000052080',
                wbsInternalId: '00010521',
                activityNumber: '9760',
                shortDescription: 'Muu',
                sapProjectInternalId: '00019987',
              },
            ],
          },
        },
      ],
    });
  });
});
