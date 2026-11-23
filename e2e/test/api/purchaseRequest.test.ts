// TRPC api tests for purchase requests (ostotilauspyyntö)
import { expect } from '@playwright/test';
import { clearData, getAuditEvents, getMailEvents } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { TEST_USER, type UserSessionObject } from '@utils/users.js';

import type { User } from '@shared/schema/user.js';

import { testInvestmentProject, testProjectObject } from './projectObjectData.js';

const SAP_PROJECT_ID = 'A1111_11000';
const SAP_WBS_ID = 'A1111_110000';
// testProjectObject runs 2021-01-01 - 2022-01-01, so the contract price goes to its last year
const CONTRACT_PRICE_YEAR = 2022;

test.describe('Purchase requests', () => {
  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
    await clearData();
  });

  /** Investment project owned by DEV_USER with one project object, optionally with SAP ids. */
  async function createProjectObject(
    adminSession: Pick<UserSessionObject, 'client'>,
    devUser: User,
    withWbs = true,
  ) {
    const project = await adminSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(devUser),
    });
    const { projectObjectId } = await adminSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject(project.projectId, project.committees, devUser),
    );
    if (withWbs) {
      await adminSession.client.sapIdentifier.setIdentifier.mutate({
        projectId: project.projectId,
        identifier: SAP_PROJECT_ID,
      });
      await adminSession.client.sapIdentifier.setIdentifier.mutate({
        projectId: project.projectId,
        projectObjectId,
        identifier: SAP_WBS_ID,
      });
    }
    return { projectId: project.projectId, projectObjectId, committee: project.committees[0] };
  }

  async function createCompany(adminSession: Pick<UserSessionObject, 'client'>) {
    const businessId = `${Math.floor(Math.random() * 10_000_000)}-1`;
    await adminSession.client.company.upsert.mutate({ businessId, companyName: 'Toimittaja Oy' });
    const company = await adminSession.client.company.getById.query({ businessId });
    const email = `myyja-${businessId}@example.com`;
    await adminSession.client.company.upsertContact.mutate({
      contactName: 'Maija Myyjä',
      phoneNumber: '0401234567',
      emailAddress: email,
      companyId: company.id as string,
    });
    const contacts = await adminSession.client.company.getAllContacts.query();
    const contact = contacts.find((c) => c.emailAddress === email);
    return { companyId: company.id as string, companyContactId: contact?.id as string };
  }

  const request = (
    projectObjectId: string,
    user: User,
    company: { companyId: string; companyContactId: string },
  ) => ({
    projectObjectId,
    responsiblePerson: user.id,
    orderer: user.id,
    ...company,
    // Kohde dates, unchanged
    startDate: '2021-01-01',
    endDate: '2022-01-01',
    costCenterId: '111850',
    frameworkAgreementId: null,
    vatRate: '01',
    isContractPrice: false,
    contractPrice: null,
    phasePrices: [
      { phaseCode: '3110', phaseName: 'Rakennuttamispalvelut', amount: 1_000_000 },
      { phaseCode: '3210', phaseName: 'Ajorata', amount: 2_500_000 },
    ],
    additionalInfo: 'Urakka alkaa viikolla 12',
  });

  test('requires write access and a WBS', async ({ adminSession, devSession, testSession }) => {
    const company = await createCompany(adminSession);

    const withoutWbs = await createProjectObject(adminSession, devSession.user, false);
    await expect(
      devSession.client.purchaseRequest.upsert.mutate(
        request(withoutWbs.projectObjectId, devSession.user, company),
      ),
    ).rejects.toThrowError('purchaseRequest.error.wbsMissing');

    const { projectObjectId } = await createProjectObject(adminSession, devSession.user);
    await expect(
      testSession.client.purchaseRequest.upsert.mutate(
        request(projectObjectId, testSession.user, company),
      ),
    ).rejects.toThrowError('error.insufficientPermissions');

    const created = await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );
    expect(created).toMatchObject({
      projectObjectId,
      companyName: 'Toimittaja Oy',
      costCenterId: '111850',
      purchaseOrderNumber: null,
    });
    expect(created.phasePrices).toHaveLength(2);

    const list = await testSession.client.purchaseRequest.list.query({ projectObjectId });
    expect(list.map((r) => r.id)).toEqual([created.id]);
  });

  test('rejects a contact of another company and contract price without amount', async ({
    adminSession,
    devSession,
  }) => {
    const company = await createCompany(adminSession);
    const other = await createCompany(adminSession);
    const { projectObjectId } = await createProjectObject(adminSession, devSession.user);

    await expect(
      devSession.client.purchaseRequest.upsert.mutate({
        ...request(projectObjectId, devSession.user, company),
        companyContactId: other.companyContactId,
      }),
    ).rejects.toThrowError('purchaseRequest.error.contactNotInCompany');

    await expect(
      devSession.client.purchaseRequest.upsert.mutate({
        ...request(projectObjectId, devSession.user, company),
        isContractPrice: true,
        contractPrice: null,
      }),
    ).rejects.toThrowError('purchaseRequest.error.contractPriceRequired');
  });

  test('phases must belong to the cost centre, names come from the mapping', async ({
    adminSession,
    devSession,
  }) => {
    const company = await createCompany(adminSession);
    const { projectObjectId } = await createProjectObject(adminSession, devSession.user);

    // 2201 Liikennesuunnittelu belongs to 111853, not 111850
    await expect(
      devSession.client.purchaseRequest.upsert.mutate({
        ...request(projectObjectId, devSession.user, company),
        phasePrices: [{ phaseCode: '2201', phaseName: 'Liikennesuunnittelu', amount: 100 }],
      }),
    ).rejects.toThrowError('purchaseRequest.error.phaseNotInCostCenter');

    const created = await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      phasePrices: [{ phaseCode: '3210', phaseName: 'Väärä nimi', amount: 100 }],
    });
    expect(created.phasePrices).toEqual([{ phaseCode: '3210', phaseName: 'Ajorata', amount: 100 }]);
  });

  async function getYearBudget(
    session: Pick<UserSessionObject, 'client'>,
    projectObjectId: string,
  ) {
    const budget = await session.client.projectObject.getBudget.query({ projectObjectId });
    return budget.find((b) => b.year === CONTRACT_PRICE_YEAR)?.budgetItems;
  }

  test('contract price is added to the year budget, a resend applies only the difference', async ({
    adminSession,
    devSession,
  }) => {
    const company = await createCompany(adminSession);
    const { projectObjectId, committee } = await createProjectObject(adminSession, devSession.user);
    // amount (Talousarvio) can be set by admins/finance only
    await adminSession.client.investmentProjectObject.updateBudget.mutate({
      projectObjectId,
      budgetItems: [
        { year: CONTRACT_PRICE_YEAR, contractPrice: 1_000_000, amount: 200_000, committee },
      ],
    });

    const first = await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      isContractPrice: true,
      contractPrice: 3_500_000,
    });
    let year = await getYearBudget(devSession, projectObjectId);
    expect(year?.contractPrice).toBe(4_500_000);
    // forecast = contract price - amount
    expect(year?.forecast).toBe(4_300_000);

    // Resending the same request with a new price adds only the difference
    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      id: first.id,
      isContractPrice: true,
      contractPrice: 4_000_000,
    });
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.contractPrice).toBe(5_000_000);
    expect(year?.forecast).toBe(4_800_000);

    // Another request of the same kohde adds up
    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      isContractPrice: true,
      contractPrice: 500_000,
    });
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.contractPrice).toBe(5_500_000);
    expect(year?.forecast).toBe(5_300_000);

    // Resending the first request without contract price removes its contract price,
    // and its phases count instead: 15 000 € + 35 000 € - 2 000 €
    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      id: first.id,
    });
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.contractPrice).toBe(1_500_000);
    expect(year?.forecast).toBe(4_800_000);
  });

  test('forecast = contract price + phase prices of requests without contract price - amount', async ({
    adminSession,
    devSession,
  }) => {
    const company = await createCompany(adminSession);
    const { projectObjectId, committee } = await createProjectObject(adminSession, devSession.user);

    // Empty values count as 0. Phases 10 000 € + 25 000 € = 35 000 €
    const first = await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );
    let year = await getYearBudget(devSession, projectObjectId);
    expect(year?.forecast).toBe(3_500_000);
    expect(year?.contractPrice ?? null).toBe(null);

    // amount (Talousarvio) can be set by admins/finance only
    await adminSession.client.investmentProjectObject.updateBudget.mutate({
      projectObjectId,
      budgetItems: [{ year: CONTRACT_PRICE_YEAR, amount: 10_000_000, committee }],
    });
    // Resending the same request does not count it twice: 35 000 € - 100 000 €
    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      id: first.id,
    });
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.forecast).toBe(-6_500_000);

    // Another request without contract price adds up: 2 * 35 000 € - 100 000 €
    await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.forecast).toBe(-3_000_000);

    // Switching the first request to contract price: its phases no longer count,
    // its contract price does: 35 000 € + 35 000 € - 100 000 €
    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      id: first.id,
      isContractPrice: true,
      contractPrice: 3_500_000,
    });
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.contractPrice).toBe(3_500_000);
    expect(year?.forecast).toBe(-3_000_000);

    // Both kinds add up: 35 000 € + 35 000 € + 5 000 € - 100 000 €
    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      phasePrices: [{ phaseCode: '3110', phaseName: 'Rakennuttamispalvelut', amount: 500_000 }],
    });
    year = await getYearBudget(devSession, projectObjectId);
    expect(year?.forecast).toBe(-2_500_000);
  });

  test('dates are the kohde dates and follow the normal kohde validation', async ({
    adminSession,
    devSession,
  }) => {
    const company = await createCompany(adminSession);
    const { projectId, projectObjectId } = await createProjectObject(adminSession, devSession.user);

    const defaults = await devSession.client.purchaseRequest.getDefaults.query({
      projectObjectId,
    });
    expect(defaults).toMatchObject({ startDate: '2021-01-01', endDate: '2022-01-01' });

    // Kohde must stay inside the hanke dates (2021-01-01 - 2022-01-01)
    await expect(
      devSession.client.purchaseRequest.upsert.mutate({
        ...request(projectObjectId, devSession.user, company),
        endDate: '2023-01-01',
      }),
    ).rejects.toThrowError('projectObject.error.projectNotIncluded');

    await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      startDate: '2021-03-01',
    });
    const projectObject = await devSession.client.investmentProjectObject.get.query({
      projectId,
      projectObjectId,
    });
    expect(projectObject.startDate).toBe('2021-03-01');
  });

  test('supplier contact is added as Urakoitsijan edustaja', async ({
    adminSession,
    devSession,
  }) => {
    const company = await createCompany(adminSession);
    const { projectObjectId } = await createProjectObject(adminSession, devSession.user);

    const before = await devSession.client.purchaseRequest.getDefaults.query({ projectObjectId });
    expect(before.companyContactId).toBeNull();

    await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );
    // Sending again with the same contact does not duplicate the role
    await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );

    const after = await devSession.client.purchaseRequest.getDefaults.query({ projectObjectId });
    expect(after).toMatchObject(company);
    const auditEvents = await getAuditEvents('purchaseRequest.addContractorContact');
    expect(auditEvents.filter((e) => e.eventData.projectObjectId === projectObjectId)).toHaveLength(
      1,
    );
  });

  test('finance sets the order number; resend replaces the request without a finance link', async ({
    adminSession,
    devSession,
    testSession,
    modifyPermissions,
  }) => {
    const company = await createCompany(adminSession);
    const { projectId, projectObjectId } = await createProjectObject(adminSession, devSession.user);

    const created = await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );

    await expect
      .poll(async () => (await getMailEvents(projectId)).map((m) => m.templateName), {
        timeout: 15000,
      })
      .toContain('purchase-request');
    const [firstMail] = await getMailEvents(projectId);
    expect(firstMail.html).toContain(`/talous/ostotilaus/${created.id}`);
    expect(created.additionalInfo).toBe('Urakka alkaa viikolla 12');
    expect(firstMail.html).toContain('Urakka alkaa viikolla 12');

    // Only finance can set the order number
    await expect(
      devSession.client.purchaseRequest.setPurchaseOrderNumber.mutate({
        id: created.id,
        purchaseOrderNumber: '4500012345',
      }),
    ).rejects.toThrowError('error.insufficientPermissions');

    await modifyPermissions(TEST_USER, ['financeOffice.write']);
    const withNumber = await testSession.client.purchaseRequest.setPurchaseOrderNumber.mutate({
      id: created.id,
      purchaseOrderNumber: '4500012345',
    });
    expect(withNumber.purchaseOrderNumber).toBe('4500012345');

    // Resend replaces the same row
    const updated = await devSession.client.purchaseRequest.upsert.mutate({
      ...request(projectObjectId, devSession.user, company),
      id: created.id,
      costCenterId: '111851',
    });
    expect(updated.id).toBe(created.id);
    expect(updated.costCenterId).toBe('111851');
    expect(updated.purchaseOrderNumber).toBe('4500012345');
    expect(await devSession.client.purchaseRequest.list.query({ projectObjectId })).toHaveLength(1);

    await expect
      .poll(async () => (await getMailEvents(projectId)).length, { timeout: 15000 })
      .toBe(2);
    const mails = await getMailEvents(projectId);
    const updateMail = mails.find((m) => m.html.includes('päivittänyt'));
    expect(updateMail?.html).toContain('4500012345');
    expect(updateMail?.html).not.toContain('/talous/ostotilaus/');

    expect(
      (await getAuditEvents('purchaseRequest.setPurchaseOrderNumber')).some(
        (e) => e.eventData.id === created.id,
      ),
    ).toBe(true);
    expect(
      (await getAuditEvents('purchaseRequest.update')).some((e) => e.eventData.id === created.id),
    ).toBe(true);
  });

  test('only admin can delete', async ({ adminSession, devSession }) => {
    const company = await createCompany(adminSession);
    const { projectObjectId } = await createProjectObject(adminSession, devSession.user);
    const created = await devSession.client.purchaseRequest.upsert.mutate(
      request(projectObjectId, devSession.user, company),
    );

    // Owner of the kohde is not enough
    await expect(
      devSession.client.purchaseRequest.delete.mutate({ id: created.id }),
    ).rejects.toThrowError('error.insufficientPermissions');

    await adminSession.client.purchaseRequest.delete.mutate({ id: created.id });
    expect(await devSession.client.purchaseRequest.list.query({ projectObjectId })).toEqual([]);
    await expect(
      adminSession.client.purchaseRequest.delete.mutate({ id: created.id }),
    ).rejects.toThrowError('purchaseRequest.error.notFound');
    expect(
      (await getAuditEvents('purchaseRequest.delete')).some((e) => e.eventData.id === created.id),
    ).toBe(true);
  });
});
