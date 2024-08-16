import { expect, test } from '@playwright/test';
import { clearData, clearObjects } from '@utils/db.js';
import { login, refreshSession } from '@utils/page.js';
import { ADMIN_USER, DEV_USER, UserSessionObject, clearUserPermissions } from '@utils/users.js';

import { User } from '@shared/schema/user.js';

import {
  invalidDateProjectObject,
  testInvestmentProject,
  testMaintenanceProject,
  testProjectObject,
  testProjectObject2,
  testProjectObject3,
} from './projectObjectData.js';

let user: User;
let investmentProject: Record<string, any>;
let maintenanceProject: Record<string, any>;
let adminSession: UserSessionObject;
let devSession: UserSessionObject;

test.describe('Common Project Object endpoints', () => {
  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    devSession = await login(browser, DEV_USER);
    adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: DEV_USER,
        permissions: ['investmentProject.write', 'maintenanceProject.write'],
      },
    ]);
    devSession = await refreshSession(browser, DEV_USER, devSession.page);
  });

  test.beforeEach(async () => {
    user = await devSession.client.user.self.query();
    investmentProject = await devSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(user),
      keepOwnerRights: true,
    });
    maintenanceProject = await devSession.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(user),
      keepOwnerRights: true,
    });
  });

  test.afterEach(async () => {
    await clearObjects();
  });

  test.afterAll(async () => {
    const users = await adminSession.client.user.getAll.query();
    await clearUserPermissions(
      adminSession.client,
      users.map((user) => user.id),
    );
    await clearData();
  });

  test('Investment project object budget updates', async () => {
    const investmentProject = await devSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(user),
    });

    const projectObject = testProjectObject(investmentProject.projectId, user);

    const resp = await devSession.client.investmentProjectObject.upsert.mutate(projectObject);
    expect(resp.projectObjectId).toBeTruthy();

    const budget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });
    expect(budget).toStrictEqual([]);

    // Update budget
    const budgetUpdate = {
      projectObjectId: resp.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 10000,
          contractPrice: 10000,
          amount: 10000,
          forecast: 2500,
          kayttosuunnitelmanMuutos: 5000,
        },
      ],
    };
    await devSession.client.investmentProjectObject.updateBudget.mutate(budgetUpdate);

    // Get updated budget
    const updatedBudget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });
    expect(updatedBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 10000,
          forecast: 2500,
          kayttosuunnitelmanMuutos: 5000,
        },
      },
    ]);

    // add budget for another year and update existing
    const partialBudgetUpdate = {
      projectObjectId: resp.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 10000,
          contractPrice: 10000,
          amount: 12500,
          forecast: -1000,
          kayttosuunnitelmanMuutos: 5000,
        },
        {
          year: 2022,
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      ],
    };
    await devSession.client.investmentProjectObject.updateBudget.mutate(partialBudgetUpdate);

    // Get updated budget
    const partialUpdatedBudget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });

    expect(partialUpdatedBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 12500,
          forecast: -1000,
          kayttosuunnitelmanMuutos: 5000,
        },
      },
      {
        year: 2022,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      },
    ]);

    const projectObject2 = testProjectObject(investmentProject.projectId, user);
    const resp2 = await devSession.client.investmentProjectObject.upsert.mutate({
      ...projectObject2,
      budgetUpdate: {
        budgetItems: [
          {
            year: 2021,
            estimate: 10000,
            contractPrice: 10000,
            amount: 7500,
            forecast: 2000,
            kayttosuunnitelmanMuutos: 1000,
          },
          {
            year: 2022,
            estimate: 10000,
            contractPrice: 10000,
            amount: 5000,
            forecast: -1000,
            kayttosuunnitelmanMuutos: 1000,
          },
        ],
      },
    });
    expect(resp2.projectObjectId).toBeTruthy();

    const projectBudget = await devSession.client.project.getBudget.query({
      projectId: investmentProject.projectId,
    });
    expect(projectBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: null,
          amount: 20000, // Sum of project object amounts
          forecast: 1000,
          kayttosuunnitelmanMuutos: 6000,
        },
      },
      {
        year: 2022,
        budgetItems: {
          estimate: null,
          amount: 12500, // Sum of project object amounts
          forecast: -3500,
          kayttosuunnitelmanMuutos: 1000,
        },
      },
    ]);
  });

  test('Maintenance project object budget updates', async () => {
    const maintenanceProject = await devSession.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(user),
    });

    const projectObject = testProjectObject(maintenanceProject.projectId, user, 'maintenance');

    const resp = await devSession.client.maintenanceProjectObject.upsert.mutate(projectObject);
    expect(resp.projectObjectId).toBeTruthy();

    const budget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });
    expect(budget).toStrictEqual([]);

    // Update budget
    const budgetUpdate = {
      projectObjectId: resp.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 10000,
          contractPrice: 10000,
          amount: 10000,
          forecast: 2500,
          kayttosuunnitelmanMuutos: 5000,
        },
      ],
    };
    await devSession.client.maintenanceProjectObject.updateBudget.mutate(budgetUpdate);

    // Get updated budget
    const updatedBudget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });
    expect(updatedBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 10000,
          forecast: 2500,
          kayttosuunnitelmanMuutos: 5000,
        },
      },
    ]);

    // add budget for another year and update existing
    const partialBudgetUpdate = {
      projectObjectId: resp.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 10000,
          contractPrice: 10000,
          amount: 12500,
          forecast: -1000,
          kayttosuunnitelmanMuutos: 5000,
        },
        {
          year: 2022,
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      ],
    };
    await devSession.client.maintenanceProjectObject.updateBudget.mutate(partialBudgetUpdate);

    // Get updated budget
    const partialUpdatedBudget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });

    expect(partialUpdatedBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 12500,
          forecast: -1000,
          kayttosuunnitelmanMuutos: 5000,
        },
      },
      {
        year: 2022,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      },
    ]);

    const projectObject2 = testProjectObject(maintenanceProject.projectId, user, 'maintenance');
    const resp2 = await devSession.client.maintenanceProjectObject.upsert.mutate({
      ...projectObject2,
      budgetUpdate: {
        budgetItems: [
          {
            year: 2021,
            estimate: 10000,
            contractPrice: 10000,
            amount: 7500,
            forecast: 2000,
            kayttosuunnitelmanMuutos: 1000,
          },
          {
            year: 2022,
            estimate: 10000,
            contractPrice: 10000,
            amount: 5000,
            forecast: -1000,
            kayttosuunnitelmanMuutos: 1000,
          },
        ],
      },
    });
    expect(resp2.projectObjectId).toBeTruthy();

    const projectBudget = await devSession.client.project.getBudget.query({
      projectId: maintenanceProject.projectId,
    });
    expect(projectBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: null,
          amount: 20000, // Sum of project object amounts
          forecast: 1000,
          kayttosuunnitelmanMuutos: 6000,
        },
      },
      {
        year: 2022,
        budgetItems: {
          estimate: null,
          amount: 12500, // Sum of project object amounts
          forecast: -3500,
          kayttosuunnitelmanMuutos: 1000,
        },
      },
    ]);
  });

  test('project object validation', async () => {
    const validationResult = await devSession.client.projectObject.upsertValidate.query(
      invalidDateProjectObject(investmentProject.projectId, user),
    );

    expect(validationResult).toStrictEqual({
      errors: {
        startDate: {
          message: 'projectObject.error.endDateBeforeStartDate',
          type: 'custom',
        },
        endDate: {
          message: 'projectObject.error.endDateBeforeStartDate',
          type: 'custom',
        },
      },
    });
  });

  test('project object validation with date constraints', async () => {
    const investmentProjectObjectData = testProjectObject(investmentProject.projectId, user);
    const maintenanceProjectObjectData = testProjectObject(
      maintenanceProject.projectId,
      user,
      'maintenance',
    );

    const investmentProjectObject = await devSession.client.investmentProjectObject.upsert.mutate(
      investmentProjectObjectData,
    );
    const maintenanceProjectObject = await devSession.client.maintenanceProjectObject.upsert.mutate(
      maintenanceProjectObjectData,
    );

    const investmentBudgetUpdateInput = {
      projectObjectId: investmentProjectObject.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          contractPrice: 50000,
          amount: 50000,
          forecast: 50000,
          kayttosuunnitelmanMuutos: 0,
        },
      ],
    };
    const maintenanceBudgetUpdateInput = {
      projectObjectId: maintenanceProjectObject.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          contractPrice: 50000,
          amount: 50000,
          forecast: 50000,
          kayttosuunnitelmanMuutos: 0,
        },
      ],
    };

    await devSession.client.investmentProjectObject.updateBudget.mutate(
      investmentBudgetUpdateInput,
    );
    await devSession.client.maintenanceProjectObject.updateBudget.mutate(
      maintenanceBudgetUpdateInput,
    );

    const investmentProjecObjectWithNewDates = {
      ...investmentProjectObject,
      startDate: '2023-01-01',
      endDate: '2024-01-01',
    };

    const maintenanceProjecObjectWithNewDates = {
      ...maintenanceProjectObject,
      startDate: '2023-01-01',
      endDate: '2024-01-01',
    };

    const investmentValidationResult = await devSession.client.projectObject.upsertValidate.query(
      investmentProjecObjectWithNewDates,
    );
    const maintenanceValidationResult = await devSession.client.projectObject.upsertValidate.query(
      maintenanceProjecObjectWithNewDates,
    );

    expect(investmentValidationResult).toStrictEqual({
      errors: {
        startDate: { type: 'custom', message: 'projectObject.error.budgetNotIncluded' },
        endDate: { type: 'custom', message: 'projectObject.error.projectNotIncluded' },
      },
    });
    expect(maintenanceValidationResult).toStrictEqual({
      errors: {
        startDate: { type: 'custom', message: 'projectObject.error.budgetNotIncluded' },
        endDate: { type: 'custom', message: 'projectObject.error.projectNotIncluded' },
      },
    });
  });
  test('project object search', async () => {
    const user = await devSession.client.user.self.query();

    await devSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject(investmentProject.projectId, user),
    );
    await devSession.client.maintenanceProjectObject.upsert.mutate(
      testProjectObject(maintenanceProject.projectId, user, 'maintenance'),
    );

    await devSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject2(investmentProject.projectId, user),
    );
    await devSession.client.maintenanceProjectObject.upsert.mutate(
      testProjectObject2(maintenanceProject.projectId, user, 'maintenance'),
    );

    await devSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject3(investmentProject.projectId, user),
    );
    await devSession.client.maintenanceProjectObject.upsert.mutate(
      testProjectObject3(maintenanceProject.projectId, user, 'maintenance'),
    );

    const searchResult = await devSession.client.projectObject.search.query({
      dateRange: {
        startDate: '2021-01-01',
        endDate: '2021-01-31',
      },
    });
    const searchResult2 = await devSession.client.projectObject.search.query({
      dateRange: {
        startDate: '2021-01-01',
        endDate: '2021-02-28',
      },
    });

    const searchResult3 = await devSession.client.projectObject.search.query({
      dateRange: {
        startDate: '2021-01-01',
        endDate: '2021-03-31',
      },
    });

    expect(searchResult.projectObjects.length).toBe(2);
    expect(searchResult2.projectObjects.length).toBe(4);
    expect(searchResult3.projectObjects.length).toBe(6);
  });
});

test.describe('Investment Project Object endpoints', () => {
  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: DEV_USER,
        permissions: ['investmentProject.write'],
      },
    ]);
    devSession = await login(browser, DEV_USER);
  });

  test.beforeEach(async () => {
    // There should be at least one user because this is executed after login
    [user] = await devSession.client.user.getAll.query();
  });

  test.afterEach(async () => {
    await clearObjects();
  });

  test('Project Object upsertion', async () => {
    const user = await devSession.client.user.self.query();

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(user),
    });

    const projectObject = testProjectObject(project.projectId, user);
    const resp = await devSession.client.investmentProjectObject.upsert.mutate(projectObject);

    expect(resp.projectObjectId).toBeTruthy();

    const updatedProjectObject = {
      ...projectObject,
      projectObjectId: resp.projectObjectId,
      description: 'Updated description',
    };

    const updatedResp =
      await devSession.client.investmentProjectObject.upsert.mutate(updatedProjectObject);

    expect(updatedResp.projectObjectId).toBe(resp.projectObjectId);

    // partial update
    const partialUpdate = {
      projectObjectId: resp.projectObjectId,
      description: 'Partial update',
    };

    const partialUpdateResp =
      await devSession.client.investmentProjectObject.upsert.mutate(partialUpdate);

    expect(partialUpdateResp.projectObjectId).toBe(resp.projectObjectId);
  });
});

test.describe('Maintenance Project Object endpoints', () => {
  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: DEV_USER,
        permissions: ['maintenanceProject.write'],
      },
    ]);
    devSession = await login(browser, DEV_USER);
  });

  test.beforeEach(async () => {
    // There should be at least one user because this is executed after login
    [user] = await devSession.client.user.getAll.query();
  });

  test.afterEach(async () => {
    await clearObjects();
  });

  test('Project Object upsertion', async () => {
    const user = await devSession.client.user.self.query();

    const project = await devSession.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(user),
    });

    const projectObject = testProjectObject(project.projectId, user, 'maintenance');
    const resp = await devSession.client.maintenanceProjectObject.upsert.mutate(projectObject);

    expect(resp.projectObjectId).toBeTruthy();

    const updatedProjectObject = {
      ...projectObject,
      projectObjectId: resp.projectObjectId,
      description: 'Updated description',
    };

    const updatedResp =
      await devSession.client.maintenanceProjectObject.upsert.mutate(updatedProjectObject);

    expect(updatedResp.projectObjectId).toBe(resp.projectObjectId);

    // partial update
    const partialUpdate = {
      projectObjectId: resp.projectObjectId,
      description: 'Partial update',
    };

    const partialUpdateResp =
      await devSession.client.maintenanceProjectObject.upsert.mutate(partialUpdate);

    expect(partialUpdateResp.projectObjectId).toBe(resp.projectObjectId);
  });
});
