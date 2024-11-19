import { expect } from '@playwright/test';
import { clearData, clearObjects } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { DEV_USER } from '@utils/users.js';

import {
  invalidDateProjectObject,
  testInvestmentProject,
  testMaintenanceProject,
  testProjectObject,
  testProjectObject2,
  testProjectObject3,
} from './projectObjectData.js';

let investmentProject: Record<string, any>;
let maintenanceProject: Record<string, any>;

test.describe('Common Project Object endpoints', () => {
  test.beforeAll(async ({ modifyPermissions }) => {
    await modifyPermissions(DEV_USER, [
      'investmentProject.write',
      'investmentFinancials.write',
      'maintenanceFinancials.write',
      'maintenanceProject.write',
    ]);
  });
  test.beforeEach(async ({ workerDevSession }) => {
    investmentProject = await workerDevSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(workerDevSession.user),
      keepOwnerRights: true,
    });

    maintenanceProject = await workerDevSession.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(workerDevSession.user),
      keepOwnerRights: true,
    });
  });

  test.afterEach(async () => {
    await clearObjects();
  });

  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
    await clearData();
  });

  test('Investment project object budget updates', async ({ workerDevSession }) => {
    const investmentProject = await workerDevSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(workerDevSession.user),
    });

    const projectObject = testProjectObject(
      investmentProject.projectId,
      investmentProject.committees,
      workerDevSession.user,
    );

    const resp = await workerDevSession.client.investmentProjectObject.upsert.mutate(projectObject);
    expect(resp.projectObjectId).toBeTruthy();

    const budget = await workerDevSession.client.projectObject.getBudget.query({
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
          committee: investmentProject.committees[0],
        },
      ],
    };
    await workerDevSession.client.investmentProjectObject.updateBudget.mutate(budgetUpdate);

    // Get updated budget
    const updatedBudget = await workerDevSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });

    expect(updatedBudget).toStrictEqual([
      {
        year: 2021,
        committee: investmentProject.committees[0],
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
          committee: investmentProject.committees[0],
        },
        {
          year: 2022,
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
          committee: investmentProject.committees[0],
        },
      ],
    };
    await workerDevSession.client.investmentProjectObject.updateBudget.mutate(partialBudgetUpdate);

    // Get updated budget
    const partialUpdatedBudget = await workerDevSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });

    expect(partialUpdatedBudget).toStrictEqual([
      {
        year: 2021,
        committee: investmentProject.committees[0],
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
        committee: investmentProject.committees[0],
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      },
    ]);

    const projectObject2 = testProjectObject(
      investmentProject.projectId,
      investmentProject.committees,
      workerDevSession.user,
    );
    const resp2 = await workerDevSession.client.investmentProjectObject.upsert.mutate({
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
            committee: projectObject2.committee,
          },
          {
            year: 2022,
            estimate: 10000,
            contractPrice: 10000,
            amount: 5000,
            forecast: -1000,
            kayttosuunnitelmanMuutos: 1000,
            committee: projectObject2.committee,
          },
        ],
      },
    });
    expect(resp2.projectObjectId).toBeTruthy();

    const projectBudget = await workerDevSession.client.project.getBudget.query({
      projectId: investmentProject.projectId,
    });

    expect(projectBudget).toStrictEqual([
      {
        year: 2021,
        committee: investmentProject.committees[0],
        budgetItems: {
          estimate: null,
          amount: 20000, // Sum of project object amounts
          forecast: 1000,
          kayttosuunnitelmanMuutos: 6000,
        },
      },
      {
        year: 2022,
        committee: investmentProject.committees[0],
        budgetItems: {
          estimate: null,
          amount: 12500, // Sum of project object amounts
          forecast: -3500,
          kayttosuunnitelmanMuutos: 1000,
        },
      },
    ]);
  });

  test('Maintenance project object budget updates', async ({ workerDevSession }) => {
    const maintenanceProject = await workerDevSession.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(workerDevSession.user),
    });

    const projectObject = testProjectObject(
      maintenanceProject.projectId,
      [null],
      workerDevSession.user,
      'maintenance',
    );

    const resp =
      await workerDevSession.client.maintenanceProjectObject.upsert.mutate(projectObject);
    expect(resp.projectObjectId).toBeTruthy();

    const budget = await workerDevSession.client.projectObject.getBudget.query({
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
          committee: null,
        },
      ],
    };
    await workerDevSession.client.maintenanceProjectObject.updateBudget.mutate(budgetUpdate);

    // Get updated budget
    const updatedBudget = await workerDevSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });
    expect(updatedBudget).toStrictEqual([
      {
        year: 2021,
        committee: null,
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
          committee: null,
        },
        {
          year: 2022,
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
          committee: null,
        },
      ],
    };
    await workerDevSession.client.maintenanceProjectObject.updateBudget.mutate(partialBudgetUpdate);

    // Get updated budget
    const partialUpdatedBudget = await workerDevSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });

    expect(partialUpdatedBudget).toStrictEqual([
      {
        year: 2021,
        committee: null,
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
        committee: null,
        budgetItems: {
          estimate: 10000,
          contractPrice: 10000,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      },
    ]);

    const projectObject2 = testProjectObject(
      maintenanceProject.projectId,
      [null],
      workerDevSession.user,
      'maintenance',
    );
    const resp2 = await workerDevSession.client.maintenanceProjectObject.upsert.mutate({
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
            committee: null,
          },
          {
            year: 2022,
            estimate: 10000,
            contractPrice: 10000,
            amount: 5000,
            forecast: -1000,
            kayttosuunnitelmanMuutos: 1000,
            committee: null,
          },
        ],
      },
    });
    expect(resp2.projectObjectId).toBeTruthy();

    const projectBudget = await workerDevSession.client.project.getBudget.query({
      projectId: maintenanceProject.projectId,
    });
    expect(projectBudget).toStrictEqual([
      {
        year: 2021,
        committee: null,
        budgetItems: {
          estimate: null,
          amount: 20000, // Sum of project object amounts
          forecast: 1000,
          kayttosuunnitelmanMuutos: 6000,
        },
      },
      {
        year: 2022,
        committee: null,
        budgetItems: {
          estimate: null,
          amount: 12500, // Sum of project object amounts
          forecast: -3500,
          kayttosuunnitelmanMuutos: 1000,
        },
      },
    ]);
  });

  test('project object validation', async ({ workerDevSession }) => {
    const validationResult = await workerDevSession.client.projectObject.upsertValidate.query(
      invalidDateProjectObject(
        investmentProject.projectId,
        investmentProject.committees,
        workerDevSession.user,
      ),
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

  test('project object validation with date constraints', async ({ workerDevSession }) => {
    const investmentProjectObjectData = testProjectObject(
      investmentProject.projectId,
      investmentProject.committees,
      workerDevSession.user,
    );
    const maintenanceProjectObjectData = testProjectObject(
      maintenanceProject.projectId,
      [null],
      workerDevSession.user,
      'maintenance',
    );

    const investmentProjectObject =
      await workerDevSession.client.investmentProjectObject.upsert.mutate(
        investmentProjectObjectData,
      );
    const maintenanceProjectObject =
      await workerDevSession.client.maintenanceProjectObject.upsert.mutate(
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
          committee: investmentProject.committees[0],
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
          committee: null,
        },
      ],
    };

    await workerDevSession.client.investmentProjectObject.updateBudget.mutate(
      investmentBudgetUpdateInput,
    );
    await workerDevSession.client.maintenanceProjectObject.updateBudget.mutate(
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

    const investmentValidationResult =
      await workerDevSession.client.projectObject.upsertValidate.query(
        investmentProjecObjectWithNewDates,
      );
    const maintenanceValidationResult =
      await workerDevSession.client.projectObject.upsertValidate.query(
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
  test('project object search', async ({ workerDevSession }) => {
    await workerDevSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject(
        investmentProject.projectId,
        investmentProject.committees,
        workerDevSession.user,
      ),
    );
    await workerDevSession.client.maintenanceProjectObject.upsert.mutate(
      testProjectObject(maintenanceProject.projectId, [null], workerDevSession.user, 'maintenance'),
    );

    await workerDevSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject2(
        investmentProject.projectId,
        investmentProject.committees,
        workerDevSession.user,
      ),
    );
    await workerDevSession.client.maintenanceProjectObject.upsert.mutate(
      testProjectObject2(
        maintenanceProject.projectId,
        investmentProject.committees,
        workerDevSession.user,
        'maintenance',
      ),
    );

    await workerDevSession.client.investmentProjectObject.upsert.mutate(
      testProjectObject3(
        investmentProject.projectId,
        investmentProject.committees,
        workerDevSession.user,
      ),
    );
    await workerDevSession.client.maintenanceProjectObject.upsert.mutate(
      testProjectObject3(
        maintenanceProject.projectId,
        [null],
        workerDevSession.user,
        'maintenance',
      ),
    );

    const searchResult = await workerDevSession.client.projectObject.search.query({
      dateRange: {
        startDate: '2021-01-01',
        endDate: '2021-01-31',
      },
    });
    const searchResult2 = await workerDevSession.client.projectObject.search.query({
      dateRange: {
        startDate: '2021-01-01',
        endDate: '2021-02-28',
      },
    });

    const searchResult3 = await workerDevSession.client.projectObject.search.query({
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
  test.beforeAll(async ({ modifyPermissions }) => {
    await modifyPermissions(DEV_USER, ['investmentProject.write']);
  });

  test.afterEach(async () => {
    await clearObjects();
  });

  test('Project Object upsertion', async ({ workerDevSession }) => {
    const project = await workerDevSession.client.investmentProject.upsert.mutate({
      project: testInvestmentProject(workerDevSession.user),
    });

    const projectObject = testProjectObject(
      project.projectId,
      project.committees,
      workerDevSession.user,
    );
    const resp = await workerDevSession.client.investmentProjectObject.upsert.mutate(projectObject);

    expect(resp.projectObjectId).toBeTruthy();

    const updatedProjectObject = {
      ...projectObject,
      projectObjectId: resp.projectObjectId,
      description: 'Updated description',
    };

    const updatedResp =
      await workerDevSession.client.investmentProjectObject.upsert.mutate(updatedProjectObject);

    expect(updatedResp.projectObjectId).toBe(resp.projectObjectId);

    // partial update
    const partialUpdate = {
      projectObjectId: resp.projectObjectId,
      description: 'Partial update',
    };

    const partialUpdateResp =
      await workerDevSession.client.investmentProjectObject.upsert.mutate(partialUpdate);

    expect(partialUpdateResp.projectObjectId).toBe(resp.projectObjectId);
  });
});

test.describe('Maintenance Project Object endpoints', () => {
  test.beforeAll(async ({ modifyPermissions }) => {
    await modifyPermissions(DEV_USER, ['maintenanceProject.write']);
  });

  test.afterEach(async () => {
    await clearObjects();
  });

  test('Project Object upsertion', async ({ workerDevSession }) => {
    const project = await workerDevSession.client.maintenanceProject.upsert.mutate({
      project: testMaintenanceProject(workerDevSession.user),
    });

    const projectObject = testProjectObject(
      project.projectId,
      [null],
      workerDevSession.user,
      'maintenance',
    );
    const resp =
      await workerDevSession.client.maintenanceProjectObject.upsert.mutate(projectObject);

    expect(resp.projectObjectId).toBeTruthy();

    const updatedProjectObject = {
      ...projectObject,
      projectObjectId: resp.projectObjectId,
      description: 'Updated description',
    };

    const updatedResp =
      await workerDevSession.client.maintenanceProjectObject.upsert.mutate(updatedProjectObject);

    expect(updatedResp.projectObjectId).toBe(resp.projectObjectId);

    // partial update
    const partialUpdate = {
      projectObjectId: resp.projectObjectId,
      description: 'Partial update',
    };

    const partialUpdateResp =
      await workerDevSession.client.maintenanceProjectObject.upsert.mutate(partialUpdate);

    expect(partialUpdateResp.projectObjectId).toBe(resp.projectObjectId);
  });

  test('Project object upsertion for ongoing maintenance project', async ({ workerDevSession }) => {
    const project = await workerDevSession.client.maintenanceProject.upsert.mutate({
      project: { ...testMaintenanceProject(workerDevSession.user), endDate: 'infinity' },
    });

    const projectObject = testProjectObject(
      project.projectId,
      [null],
      workerDevSession.user,
      'maintenance',
    );
    const resp =
      await workerDevSession.client.maintenanceProjectObject.upsert.mutate(projectObject);

    expect(resp.projectObjectId).toBeTruthy();
  });

  test('Add ongoing maintenance project object', async ({ workerDevSession }) => {
    const project = await workerDevSession.client.maintenanceProject.upsert.mutate({
      project: { ...testMaintenanceProject(workerDevSession.user), endDate: 'infinity' },
    });

    const projectObject = testProjectObject(
      project.projectId,
      [null],
      workerDevSession.user,
      'maintenance',
    );
    const resp = await workerDevSession.client.maintenanceProjectObject.upsert.mutate({
      ...projectObject,
      projectId: project.projectId,
      endDate: 'infinity',
    });
    const projObj = await workerDevSession.client.maintenanceProjectObject.get.query({
      projectId: project.projectId,
      projectObjectId: resp.projectObjectId,
    });

    expect(projObj.endDate).toBe('infinity');
  });
});
