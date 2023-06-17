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
          network: [
            {
              networkId: '000051429870',
              activities: [{ activityNumber: '9116' }],
            },
          ],
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
      sapProjectInternalId: '64419995',
      shortDescription: 'Keskusta, kehitys',
      createdAt: '2020-03-26',
      createdBy: 'MATTINIE',
      updatedAt: '2020-05-20',
      updatedBy: 'MATTINIE',
      projectManagerName: 'Nieminen Matti',
      applicantName: 'Nieminen Matti',
      plannedStartDate: '2020-04-03',
      plannedEndDate: '2021-11-27',
      plant: '1111',
      companyCode: '1111',
      systemStatus: 'VAPA',
      wbs: [
        {
          wbsId: 'A1111_220000',
          wbsInternalId: '03114907',
          sapProjectInternalId: '64419995',
          shortDescription: 'Keskusta, kehitys, kohde 1',
          createdAt: '2020-04-16',
          createdBy: 'MATTIMÄK',
          updatedAt: '2020-04-17',
          updatedBy: 'LIISAMÄK',
          applicantName: 'Mäkinen Liisa',
          requestingCostCenter: '00448864',
          responsibleCostCenter: '00448864',
          projectType: 'Y4',
          priority: 'U',
          plant: '1111',
          blanketOrderId: '1234/01.01.01/2020',
          consultCompany: 'Yritys Oy',
          contractPriceInCurrencySubunit: 123123,
          decisionDateText: '16.4.2020',
          decisionMaker: 'Mäkinen',
          technicallyCompletedAt: '2021-06-28',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: [
            {
              networkId: '000074482960',
              networkName: 'Keskusta, kehitys',
              wbsInternalId: '03114907',
              sapProjectInternalId: '64419995',
              createdAt: '2020-03-28',
              createdBy: 'LIISANIE',
              actualStartDate: '2021-02-09',
              actualFinishDate: null,
              companyCode: '1111',
              plant: '1111',
              technicalCompletionDate: '2021-09-22',
              profitCenter: '0007088013',
              activities: [
                {
                  plant: '1111',
                  networkId: '000074482960',
                  orderCounter: '00000001',
                  profitCenter: '0007088013',
                  routingNumber: '0157671127',
                  wbsInternalId: '03114907',
                  activityNumber: '9497',
                  shortDescription: 'Kunnossapito',
                  sapProjectInternalId: '64419995',
                },
                {
                  plant: '1111',
                  networkId: '000074482960',
                  orderCounter: '00000002',
                  profitCenter: '0007088013',
                  routingNumber: '0157671127',
                  wbsInternalId: '03114907',
                  activityNumber: '8348',
                  shortDescription: 'Muu',
                  sapProjectInternalId: '64419995',
                },
              ],
            },
          ],
        },
        {
          wbsId: 'A1111_220001',
          wbsInternalId: '04783006',
          sapProjectInternalId: '64419995',
          shortDescription: 'Keskusta, kehitys, kohde 2',
          createdAt: '2020-04-16',
          createdBy: 'MATTIMÄK',
          updatedAt: '2020-04-23',
          updatedBy: 'LIISANIE',
          applicantName: 'Mäkinen Liisa',
          requestingCostCenter: '00448864',
          responsibleCostCenter: '00448864',
          projectType: 'Y4',
          priority: 'U',
          plant: '1111',
          blanketOrderId: '1234/01.01.01/2020',
          consultCompany: 'Yritys Oy',
          contractPriceInCurrencySubunit: 123123,
          decisionDateText: '16.4.2020',
          decisionMaker: 'Mäkinen',
          technicallyCompletedAt: '2021-06-28',
          reasonForInvestment: '30',
          reasonForEnvironmentalInvestment: '414',
          hierarchyLevel: 2,
          network: [
            {
              networkId: '000082604998',
              networkName: 'Keskusta, kehitys',
              wbsInternalId: '04783006',
              sapProjectInternalId: '64419995',
              createdAt: '2020-03-27',
              createdBy: 'LIISAMÄK',
              actualStartDate: '2021-07-12',
              actualFinishDate: null,
              companyCode: '1111',
              plant: '1111',
              technicalCompletionDate: '2021-10-02',
              profitCenter: '0006496410',
              activities: [
                {
                  plant: '1111',
                  networkId: '000082604998',
                  orderCounter: '00000001',
                  profitCenter: '0006496410',
                  routingNumber: '0233577453',
                  wbsInternalId: '04783006',
                  activityNumber: '8105',
                  shortDescription: 'Rakentaminen',
                  sapProjectInternalId: '64419995',
                },
                {
                  plant: '1111',
                  networkId: '000082604998',
                  orderCounter: '00000002',
                  profitCenter: '0006496410',
                  routingNumber: '0233577453',
                  wbsInternalId: '04783006',
                  activityNumber: '1464',
                  shortDescription: 'Ylläpito',
                  sapProjectInternalId: '64419995',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
