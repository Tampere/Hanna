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
      plant: 'A1111',
      wbs: [
        {
          wbsId: 'A1111_220000',
          wbsInternalId: '00478955',
          sapProjectInternalID: '00019987',
          shortDescription: 'Keskusta, kehitys, kohde 1',
          createdAt: '2020-04-03',
          createdBy: 'MATTINIE',
          updatedAt: '2020-04-03',
          updatedBy: 'LIISANIE',
          applicantName: 'Nieminen Matti',
          requestingCostCenter: '00283546',
          responsibleCostCenter: '00283546',
          projectType: 'Y4',
          priority: 'U',
          plant: 'A1111',
          technicallyCompletedAt: '2021-09-21',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: {
            networkId: '000057671137',
            networkName: 'Keskusta, kehitys',
            sapWBSInternalId: '00478955',
            sapProjectInternalId: '00019987',
            createdAt: '2020-02-07',
            createdBy: 'LIISAMÄK',
            actualStartDate: '2020-05-09',
            actualFinishDate: '0000-00-00',
            companyCode: '0552',
            plant: 'A1111',
            technicalCompletionDate: '2020-07-26',
            profitCenter: '0000262543',
            activities: [
              {
                routingNumber: '0000097220',
                orderCounter: '00000001',
                activityNumber: '9453',
                networkId: '000057671137',
                shortDescription: 'Lisätyö',
                sapProjectInternalId: '00019987',
                sapWBSInternalId: '00478955',
                profitCenter: '0000262543',
                plant: 'A1111',
              },
              {
                routingNumber: '0000097220',
                orderCounter: '00000002',
                activityNumber: '0633',
                networkId: '000057671137',
                shortDescription: 'Dokumentointi',
                sapProjectInternalId: '00019987',
                sapWBSInternalId: '00478955',
                profitCenter: '0000262543',
                plant: 'A1111',
              },
            ],
          },
        },
        {
          wbsId: 'A1111_220001',
          wbsInternalId: '00478955',
          sapProjectInternalID: '00019987',
          shortDescription: 'Keskusta, kehitys, kohde 2',
          createdAt: '2020-04-03',
          createdBy: 'MATTINIE',
          updatedAt: '2020-04-15',
          updatedBy: 'MATTINIE',
          applicantName: 'Nieminen Matti',
          requestingCostCenter: '00283546',
          responsibleCostCenter: '00283546',
          projectType: 'Y4',
          priority: 'U',
          plant: 'A1111',
          technicallyCompletedAt: '2021-09-21',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: {
            networkId: '000095541749',
            networkName: 'Keskusta, kehitys',
            sapWBSInternalId: '00478955',
            sapProjectInternalId: '00019987',
            createdAt: '2020-03-29',
            createdBy: 'MATTINIE',
            actualStartDate: '2020-06-26',
            actualFinishDate: '0000-00-00',
            companyCode: '0552',
            plant: 'A1111',
            technicalCompletionDate: '2020-09-27',
            profitCenter: '0000961013',
            activities: [
              {
                routingNumber: '0000071667',
                orderCounter: '00000001',
                activityNumber: '3140',
                networkId: '000095541749',
                shortDescription: 'Dokumentointi',
                sapProjectInternalId: '00019987',
                sapWBSInternalId: '00478955',
                profitCenter: '0000961013',
                plant: 'A1111',
              },
              {
                routingNumber: '0000071667',
                orderCounter: '00000002',
                activityNumber: '5855',
                networkId: '000095541749',
                shortDescription: 'Dokumentointi',
                sapProjectInternalId: '00019987',
                sapWBSInternalId: '00478955',
                profitCenter: '0000961013',
                plant: 'A1111',
              },
            ],
          },
        },
      ],
    });
  });
});
