import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { ADMIN_USER, DEV_USER, UserSessionObject } from '@utils/users';

import { User } from '@shared/schema/user';

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

const validProject = (userId: string, projectName = 'Test project') => ({
  projectName,
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
  let financialsSession: UserSessionObject;

  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: DEV_USER,
        permissions: ['investmentProject.write'],
      },
    ]);
    adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: DEV_USER,
        permissions: ['financials.write'],
      },
    ]);

    financialsSession = await login(browser, DEV_USER);
    devSession = await login(browser, DEV_USER);
  });

  test('project validation', async () => {
    const validationResult =
      await devSession.client.investmentProject.upsertValidate.query(invalidDateProject);

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
  test('project validation with date constraints', async () => {
    const [user] = await devSession.client.user.getAll.query();
    const project = await devSession.client.investmentProject.upsert.mutate({
      project: validProject(user.id),
    });

    const budgetUpdateInput = {
      projectId: project.projectId,
      budgetItems: [
        {
          year: 2021,
          amount: 50000,
        },
      ],
    };
    await devSession.client.project.updateBudget.mutate(budgetUpdateInput);

    const projectWithNewDates = { ...project, startDate: '2023-01-01', endDate: '2024-01-01' };

    const validationResultWithBudget =
      await devSession.client.investmentProject.upsertValidate.query(projectWithNewDates);

    const projectObject = testProjectObject(project.projectId, user);
    await devSession.client.projectObject.upsert.mutate(projectObject);

    const validationResultWithObject =
      await devSession.client.investmentProject.upsertValidate.query(projectWithNewDates);

    expect(validationResultWithObject).toStrictEqual({
      errors: {
        startDate: { type: 'custom', message: 'project.error.objectNotIncluded' },
      },
    });
    expect(validationResultWithBudget).toStrictEqual({
      errors: {
        startDate: { type: 'custom', message: 'project.error.budgetNotIncluded' },
      },
    });
  });

  test('project geometry edit', async () => {
    const user = await devSession.client.user.self.query();
    const validProjectInput = validProject(user.id);

    const validationResult =
      await devSession.client.investmentProject.upsertValidate.query(validProjectInput);
    expect(validationResult).toStrictEqual({ errors: {} });

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: validProjectInput,
    });
    const point = makePoint(326673.014866, 6823373.604181, 'EPSG:3067');

    const edit = await devSession.client.project.updateGeometry.mutate({
      projectId: project.projectId,
      features: JSON.stringify(point),
    });

    expect(edit.projectId).toEqual(project.projectId);
    expect(JSON.parse(edit.geom)).toStrictEqual({
      type: 'MultiPoint',
      crs: { type: 'name', properties: { name: 'EPSG:3067' } },
      coordinates: [[326673.014866, 6823373.604181]],
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

  test('financials writer budget update', async () => {
    const user = await financialsSession.client.user.self.query();
    const validProjectInput = validProject(user.id);

    const project = await financialsSession.client.investmentProject.upsert.mutate({
      project: validProjectInput,
    });

    const budgetUpdateInput = {
      projectId: project.projectId,
      budgetItems: [
        {
          year: 2021,
          amount: 50000,
        },
      ],
    };

    await financialsSession.client.project.updateBudget.mutate(budgetUpdateInput);

    const updatedBudgetResult = await financialsSession.client.project.getBudget.query({
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
    ]);
  });

  test('add project relation', async () => {
    const [user] = await devSession.client.user.getAll.query();
    const investmentProjectInput = validProject(user.id);
    const detailplanProjectInput = {
      ...validProject(user.id, 'Detailplan project'),
      diaryId: 'diary',
      preparer: user.id,
      district: 'district',
      blockName: 'blockName',
      addressText: 'addressText',
    };

    const investmentProject = await devSession.client.investmentProject.upsert.mutate({
      project: investmentProjectInput,
    });
    const detailplanProject = await devSession.client.detailplanProject.upsert.mutate({
      project: detailplanProjectInput,
    });

    await devSession.client.project.updateRelations.mutate({
      subjectProjectId: investmentProject.projectId,
      objectProjectId: detailplanProject.projectId,
      relation: 'related',
    });

    const { relations } = await devSession.client.project.getRelations.query({
      projectId: investmentProject.projectId,
    });
    const relatedProject = relations.related[0];

    expect(relatedProject.projectId).toBe(detailplanProject.projectId);
    expect(relatedProject.projectName).toBe(detailplanProject.projectName);
    expect(relatedProject.projectType).toBe('detailplanProject');
  });

  test('remove project relation', async () => {
    const [user] = await devSession.client.user.getAll.query();
    const investmentProjectInput = validProject(user.id);
    const detailplanProjectInput = {
      ...validProject(user.id, 'Detailplan project'),
      diaryId: 'diary',
      preparer: user.id,
      district: 'district',
      blockName: 'blockName',
      addressText: 'addressText',
    };

    const investmentProject = await devSession.client.investmentProject.upsert.mutate({
      project: investmentProjectInput,
    });
    const detailplanProject = await devSession.client.detailplanProject.upsert.mutate({
      project: detailplanProjectInput,
    });

    await devSession.client.project.updateRelations.mutate({
      subjectProjectId: investmentProject.projectId,
      objectProjectId: detailplanProject.projectId,
      relation: 'related',
    });

    await devSession.client.project.removeRelation.mutate({
      subjectProjectId: investmentProject.projectId,
      objectProjectId: detailplanProject.projectId,
      relation: 'related',
    });

    const { relations } = await devSession.client.project.getRelations.query({
      projectId: investmentProject.projectId,
    });

    expect(relations.parents).toBeNull();
    expect(relations.related).toBeNull();
    expect(relations.children).toBeNull();
  });
});
