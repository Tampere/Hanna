import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { ADMIN_USER, DEV_USER, UserSessionObject } from '@utils/users';

function makePoint(lon: number, lat: number, srid: string) {
  return [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        crs: { type: 'name', properties: { name: srid } },
        coordinates: [lon, lat],
      },
    },
  ];
}

const invalidDateProject = {
  projectName: 'Test project',
  description: 'Test description',
  owner: '1',
  personInCharge: '1',
  startDate: '2023-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  committees: ['01'],
  sapProjectId: null,
};

const validProject = (userId: string) => ({
  projectName: 'Test project',
  description: 'Test description',
  owner: userId,
  personInCharge: userId,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  committees: ['01'],
  sapProjectId: null,
});

test.describe('Project endpoints', () => {
  let adminSession: UserSessionObject;
  let devSession: UserSessionObject;

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

  test('project validation', async () => {
    const validationResult = await devSession.client.investmentProject.upsertValidate.query(
      invalidDateProject
    );

    expect(validationResult).toStrictEqual({
      errors: {
        startDate: {
          message: 'project.error.endDateBeforeStartDate',
          type: 'custom',
        },
        endDate: {
          message: 'project.error.endDateBeforeStartDate',
          type: 'custom',
        },
      },
    });
  });

  test('project geometry edit', async () => {
    const user = await devSession.client.user.self.query();
    const validProjectInput = validProject(user.id);

    const validationResult = await devSession.client.investmentProject.upsertValidate.query(
      validProjectInput
    );
    expect(validationResult).toStrictEqual({ errors: {} });

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: validProjectInput,
    });
    const point = makePoint(24487416.69375355, 6821004.272996133, 'EPSG:3878');

    const edit = await devSession.client.project.updateGeometry.mutate({
      projectId: project.projectId,
      features: JSON.stringify(point),
    });

    expect(edit.projectId).toEqual(project.projectId);
    expect(JSON.parse(edit.geom)).toStrictEqual({
      type: 'MultiPoint',
      crs: { type: 'name', properties: { name: 'EPSG:3878' } },
      coordinates: [[24487416.69375355, 6821004.272996133]],
    });
  });

  test('project budget update', async () => {
    const user = await devSession.client.user.self.query();
    const validProjectInput = validProject(user.id);

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: validProjectInput,
    });
    const budgetUpdateInput = {
      projectId: project.projectId,
      budgetItems: [
        {
          year: 2021,
          amount: 50000,
        },
        {
          year: 2022,
          amount: 60000,
        },
      ],
    };
    const getBudgetResult = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });

    expect(getBudgetResult).toStrictEqual([]);

    await devSession.client.project.updateBudget.mutate(budgetUpdateInput);

    const updatedBudgetResult = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });
    expect(updatedBudgetResult).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          amount: 50000,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
      },
      {
        year: 2022,
        budgetItems: {
          amount: 60000,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
      },
    ]);

    const budgetUpdate2021 = {
      projectId: project.projectId,
      budgetItems: [
        {
          year: 2021,
          amount: 70000,
        },
      ],
    };

    await devSession.client.project.updateBudget.mutate(budgetUpdate2021);

    const updatedBudgetResult2021 = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });
    expect(updatedBudgetResult2021).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          amount: 70000,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
      },
      {
        year: 2022,
        budgetItems: {
          amount: 60000,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
      },
    ]);
  });
});
