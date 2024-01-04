import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

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
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  test('project validation', async () => {
    const validationResult = await client.investmentProject.upsertValidate.query(
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
    const [user] = await client.user.getAll.query();
    const validProjectInput = validProject(user.id);

    const validationResult = await client.investmentProject.upsertValidate.query(validProjectInput);
    expect(validationResult).toStrictEqual({ errors: {} });

    const project = await client.investmentProject.upsert.mutate(validProjectInput);
    const point = makePoint(24487416.69375355, 6821004.272996133, 'EPSG:3878');

    const edit = await client.project.updateGeometry.mutate({
      id: project.id,
      features: JSON.stringify(point),
    });

    expect(edit.id).toBe(project.id);
    expect(JSON.parse(edit.geom)).toStrictEqual({
      type: 'MultiPoint',
      crs: { type: 'name', properties: { name: 'EPSG:3878' } },
      coordinates: [[24487416.69375355, 6821004.272996133]],
    });
  });

  test('project budget update', async () => {
    const [user] = await client.user.getAll.query();
    const validProjectInput = validProject(user.id);

    const project = await client.investmentProject.upsert.mutate(validProjectInput);
    const budgetUpdateInput = {
      projectId: project.id,
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
    const getBudgetResult = await client.project.getBudget.query({ projectId: project.id });

    expect(getBudgetResult).toStrictEqual([]);

    await client.project.updateBudget.mutate(budgetUpdateInput);

    const updatedBudgetResult = await client.project.getBudget.query({ projectId: project.id });
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
      projectId: project.id,
      budgetItems: [
        {
          year: 2021,
          amount: 70000,
        },
      ],
    };

    await client.project.updateBudget.mutate(budgetUpdate2021);

    const updatedBudgetResult2021 = await client.project.getBudget.query({ projectId: project.id });
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

  test('add project relation', async () => {
    const [user] = await client.user.getAll.query();
    const investmentProjectInput = validProject(user.id);
    const detailplanProjectInput = {
      ...validProject(user.id, 'Detailplan project'),
      diaryId: 'diary',
      preparer: user.id,
      district: 'district',
      blockName: 'blockName',
      addressText: 'addressText',
    };

    const investmentProject = await client.investmentProject.upsert.mutate(investmentProjectInput);
    const detailplanProject = await client.detailplanProject.upsert.mutate(detailplanProjectInput);

    await client.project.updateRelations.mutate({
      subjectProjectId: investmentProject.id,
      objectProjectId: detailplanProject.id,
      relation: 'related',
    });

    const { relations } = await client.project.getRelations.query({ id: investmentProject.id });
    const relatedProject = relations.related[0];

    expect(relatedProject.projectId).toBe(detailplanProject.id);
    expect(relatedProject.projectName).toBe(detailplanProject.projectName);
    expect(relatedProject.projectType).toBe('detailplanProject');
  });

  test('remove project relation', async () => {
    const [user] = await client.user.getAll.query();
    const investmentProjectInput = validProject(user.id);
    const detailplanProjectInput = {
      ...validProject(user.id, 'Detailplan project'),
      diaryId: 'diary',
      preparer: user.id,
      district: 'district',
      blockName: 'blockName',
      addressText: 'addressText',
    };

    const investmentProject = await client.investmentProject.upsert.mutate(investmentProjectInput);
    const detailplanProject = await client.detailplanProject.upsert.mutate(detailplanProjectInput);

    await client.project.updateRelations.mutate({
      subjectProjectId: investmentProject.id,
      objectProjectId: detailplanProject.id,
      relation: 'related',
    });

    await client.project.removeRelation.mutate({
      subjectProjectId: investmentProject.id,
      objectProjectId: detailplanProject.id,
      relation: 'related',
    });

    const { relations } = await client.project.getRelations.query({ id: investmentProject.id });

    expect(relations.parents).toBeNull();
    expect(relations.related).toBeNull();
    expect(relations.children).toBeNull();
  });
});
