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
            networkId: '000081988940',
            activities: [{ activityNumber: '8637' }],
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
      shortDescription: 'Keskusta, kehitys',
      createdAt: '2020-03-05',
      createdBy: 'MATTINIE',
      updatedAt: '2020-06-09',
      updatedBy: 'LIISAMÄK',
      projectManagerName: 'Mäkinen Liisa',
      applicantName: 'Mäkinen Liisa',
      plannedStartDate: '2020-06-04',
      plannedEndDate: '2021-12-17',
      plant: '1111',
      wbs: [
        {
          wbsId: 'A1111_220000',
          wbsInternalId: '00224485',
          sapProjectInternalId: '00019987',
          shortDescription: 'Keskusta, kehitys, kohde 1',
          createdAt: '2020-03-31',
          createdBy: 'LIISAMÄK',
          updatedAt: '2020-03-31',
          updatedBy: 'LIISANIE',
          applicantName: 'Mäkinen Liisa',
          requestingCostCenter: '00059793',
          responsibleCostCenter: '00059793',
          projectType: 'Y4',
          priority: 'U',
          plant: '1111',
          technicallyCompletedAt: '2023-01-05',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: {
            networkId: '000057671137',
            networkName: 'Keskusta, kehitys',
            wbsInternalId: '00224485',
            sapProjectInternalId: '00019987',
            createdAt: '2020-02-07',
            createdBy: 'LIISAMÄK',
            actualStartDate: '2020-05-09',
            actualFinishDate: null,
            companyCode: '0552',
            plant: '1111',
            technicalCompletionDate: '2020-07-26',
            profitCenter: '0000262543',
            activities: [
              {
                routingNumber: '0000097220',
                orderCounter: '00000001',
                activityNumber: '0021',
                networkId: '000057671137',
                shortDescription: 'Rakentaminen',
                sapProjectInternalId: '00019987',
                wbsInternalId: '00224485',
                profitCenter: '0000262543',
                plant: '1111',
              },
              {
                routingNumber: '0000097220',
                orderCounter: '00000002',
                activityNumber: '1230',
                networkId: '000057671137',
                shortDescription: 'Rakentaminen',
                sapProjectInternalId: '00019987',
                wbsInternalId: '00224485',
                profitCenter: '0000262543',
                plant: '1111',
              },
            ],
          },
        },
        {
          wbsId: 'A1111_220001',
          wbsInternalId: '00640994',
          sapProjectInternalId: '00019987',
          shortDescription: 'Keskusta, kehitys, kohde 2',
          createdAt: '2020-03-31',
          createdBy: 'LIISAMÄK',
          updatedAt: '2020-04-09',
          updatedBy: 'MATTIMÄK',
          applicantName: 'Mäkinen Liisa',
          requestingCostCenter: '00059793',
          responsibleCostCenter: '00059793',
          projectType: 'Y4',
          priority: 'U',
          plant: '1111',
          technicallyCompletedAt: '2023-01-05',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: {
            networkId: '000003247781',
            networkName: 'Keskusta, kehitys',
            wbsInternalId: '00640994',
            sapProjectInternalId: '00019987',
            createdAt: '2020-03-16',
            createdBy: 'MATTINIE',
            actualStartDate: '2020-06-04',
            actualFinishDate: null,
            companyCode: '0552',
            plant: '1111',
            technicalCompletionDate: '2020-09-12',
            profitCenter: '0000691185',
            activities: [
              {
                routingNumber: '0000096885',
                orderCounter: '00000001',
                activityNumber: '6885',
                networkId: '000003247781',
                shortDescription: 'Muu',
                sapProjectInternalId: '00019987',
                wbsInternalId: '00640994',
                profitCenter: '0000691185',
                plant: '1111',
              },
              {
                routingNumber: '0000096885',
                orderCounter: '00000002',
                activityNumber: '3201',
                networkId: '000003247781',
                shortDescription: 'Kunnossapito',
                sapProjectInternalId: '00019987',
                wbsInternalId: '00640994',
                profitCenter: '0000691185',
                plant: '1111',
              },
            ],
          },
        },
      ],
    });
  });
});
