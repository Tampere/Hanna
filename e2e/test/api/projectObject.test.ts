import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { ADMIN_USER, DEV_USER, UserSessionObject } from '@utils/users';

import { User } from '@shared/schema/user';

const testProject = (user: User) => ({
  projectName: 'Test project',
  description: 'Test description',
  owner: user.id,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  committees: ['01'],
  sapProjectId: null,
});

const testProjectObject = (projectId: string, user: User) => ({
  projectId,
  description: 'Test description',
  objectName: 'Test project object',
  objectStage: '01',
  lifecycleState: '01',
  objectType: ['01'],
  objectCategory: ['01'],
  objectUsage: ['01'],
  suunnitteluttajaUser: user.id,
  rakennuttajaUser: user.id,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  sapWBSId: null,
  landownership: null,
  locationOnProperty: null,
  height: null,
  objectUserRoles: [],
});

const invalidDateProjectObject = (projectId: string, user: User) => ({
  projectId: projectId,
  description: 'Test description',
  objectName: 'Test project object',
  objectStage: '01',
  lifecycleState: '01',
  objectType: ['01'],
  objectCategory: ['01'],
  objectUsage: ['01'],
  suunnitteluttajaUser: user.id,
  rakennuttajaUser: user.id,
  startDate: '2022-01-01',
  endDate: '2021-01-01',
  sapWBSId: null,
  landownership: null,
  locationOnProperty: null,
  height: null,
  objectUserRoles: [],
});

let user: User;
let project: Record<string, any>;
let adminSession: UserSessionObject;
let devSession: UserSessionObject;

test.describe('Project Object endpoints', () => {
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
    project = await devSession.client.investmentProject.upsert.mutate({
      project: testProject(user),
      keepOwnerRights: true,
    });
  });

  test('Project Object upsertion', async () => {
    const user = await devSession.client.user.self.query();

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: testProject(user),
    });

    const projectObject = testProjectObject(project.projectId, user);
    const resp = await devSession.client.projectObject.upsert.mutate(projectObject);

    expect(resp.projectObjectId).toBeTruthy();

    const updatedProjectObject = {
      ...projectObject,
      projectObjectId: resp.projectObjectId,
      description: 'Updated description',
    };

    const updatedResp = await devSession.client.projectObject.upsert.mutate(updatedProjectObject);

    expect(updatedResp.projectObjectId).toBe(resp.projectObjectId);

    // partial update
    const partialUpdate = {
      projectObjectId: resp.projectObjectId,
      description: 'Partial update',
    };

    const partialUpdateResp = await devSession.client.projectObject.upsert.mutate(partialUpdate);

    expect(partialUpdateResp.projectObjectId).toBe(resp.projectObjectId);
  });

  test('Project object budget updates', async () => {
    let user = await devSession.client.user.self.query();

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: testProject(user),
    });

    const projectObject = testProjectObject(project.projectId, user);

    const resp = await devSession.client.projectObject.upsert.mutate(projectObject);
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
          amount: 10000,
          forecast: 2500,
          kayttosuunnitelmanMuutos: 5000,
        },
      ],
    };
    await devSession.client.projectObject.updateBudget.mutate(budgetUpdate);

    // Get updated budget
    const updatedBudget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });
    expect(updatedBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
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
          amount: 12500,
          forecast: -1000,
          kayttosuunnitelmanMuutos: 5000,
        },
        {
          year: 2022,
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      ],
    };
    await devSession.client.projectObject.updateBudget.mutate(partialBudgetUpdate);

    // Get updated budget
    const partialUpdatedBudget = await devSession.client.projectObject.getBudget.query({
      projectObjectId: resp.projectObjectId,
    });

    expect(partialUpdatedBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          amount: 12500,
          forecast: -1000,
          kayttosuunnitelmanMuutos: 5000,
        },
      },
      {
        year: 2022,
        budgetItems: {
          amount: 7500,
          forecast: -2500,
          kayttosuunnitelmanMuutos: 0,
        },
      },
    ]);

    const projectObject2 = testProjectObject(project.projectId, user);
    const resp2 = await devSession.client.projectObject.upsert.mutate({
      ...projectObject2,
      budgetUpdate: {
        budgetItems: [
          {
            year: 2021,
            amount: 7500,
            forecast: 2000,
            kayttosuunnitelmanMuutos: 1000,
          },
          {
            year: 2022,
            amount: 5000,
            forecast: -1000,
            kayttosuunnitelmanMuutos: 1000,
          },
        ],
      },
    });
    expect(resp2.projectObjectId).toBeTruthy();

    const projectBudget = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });
    expect(projectBudget).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          amount: null,
          forecast: 1000,
          kayttosuunnitelmanMuutos: 6000,
        },
      },
      {
        year: 2022,
        budgetItems: {
          amount: null,
          forecast: -3500,
          kayttosuunnitelmanMuutos: 1000,
        },
      },
    ]);
  });

  test('project object validation', async () => {
    const validationResult = await devSession.client.projectObject.upsertValidate.query(
      invalidDateProjectObject(project.projectId, user),
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
    const projectObjectData = testProjectObject(project.projectId, user);

    const projectObject = await devSession.client.projectObject.upsert.mutate(projectObjectData);

    const budgetUpdateInput = {
      projectObjectId: projectObject.projectObjectId,
      budgetItems: [
        {
          year: 2021,
          amount: 50000,
          forecast: 50000,
          kayttosuunnitelmanMuutos: 0,
        },
      ],
    };
    await devSession.client.projectObject.updateBudget.mutate(budgetUpdateInput);

    const projecObjectWithNewDates = {
      ...projectObject,
      startDate: '2023-01-01',
      endDate: '2024-01-01',
    };

    const validationResult =
      await devSession.client.projectObject.upsertValidate.query(projecObjectWithNewDates);

    expect(validationResult).toStrictEqual({
      errors: {
        startDate: { type: 'custom', message: 'projectObject.error.budgetNotIncluded' },
        endDate: { type: 'custom', message: 'projectObject.error.projectNotIncluded' },
      },
    });
  });
});
