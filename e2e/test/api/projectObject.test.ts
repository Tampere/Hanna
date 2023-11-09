import test, { expect } from '@playwright/test';
import { User } from '@shared/schema/user';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

const testProject = (user: User) => ({
  projectName: 'Test project',
  description: 'Test description',
  owner: user.id,
  personInCharge: user.id,
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

test.describe('Project Object endpoints', () => {
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Project Object upsertion', async () => {
    // There should be at least one user because this is executed after login
    const [user] = await client.user.getAll.query();

    const project = await client.investmentProject.upsert.mutate(testProject(user));

    const projectObject = testProjectObject(project.id, user);
    const resp = await client.projectObject.upsert.mutate(projectObject);

    expect(resp.id).toBeTruthy();
    expect(resp.lifecycleState).toBe('01');

    const updatedProjectObject = {
      ...projectObject,
      id: resp.id,
      description: 'Updated description',
    };

    const updatedResp = await client.projectObject.upsert.mutate(updatedProjectObject);
    expect(updatedResp.id).toBe(resp.id);
    expect(updatedResp.description).toBe('Updated description');

    // partial update
    const partialUpdate = {
      id: resp.id,
      description: 'Partial update',
    };

    const partialUpdateResp = await client.projectObject.upsert.mutate(partialUpdate);
    expect(partialUpdateResp.id).toBe(resp.id);
    expect(partialUpdateResp).toStrictEqual({
      ...updatedResp,
      description: 'Partial update',
    });
  });

  test('Project object budget updates', async () => {
    const [user] = await client.user.getAll.query();

    const project = await client.investmentProject.upsert.mutate(testProject(user));

    const projectObject = testProjectObject(project.id, user);

    const resp = await client.projectObject.upsert.mutate(projectObject);
    expect(resp.id).toBeTruthy();

    const budget = await client.projectObject.getBudget.query({ projectObjectId: resp.id });
    expect(budget).toStrictEqual([]);

    // Update budget
    const budgetUpdate = {
      projectObjectId: resp.id,
      budgetItems: [
        {
          year: 2021,
          amount: 10000,
          forecast: 2500,
          kayttosuunnitelmanMuutos: 5000,
        },
      ],
    };
    await client.projectObject.updateBudget.mutate(budgetUpdate);

    // Get updated budget
    const updatedBudget = await client.projectObject.getBudget.query({ projectObjectId: resp.id });
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
      projectObjectId: resp.id,
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
    await client.projectObject.updateBudget.mutate(partialBudgetUpdate);

    // Get updated budget
    const partialUpdatedBudget = await client.projectObject.getBudget.query({
      projectObjectId: resp.id,
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

    const projectObject2 = testProjectObject(project.id, user);
    const resp2 = await client.projectObject.upsert.mutate({
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
    expect(resp2.id).toBeTruthy();

    const projectBudget = await client.project.getBudget.query({ projectId: project.id });
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
});
