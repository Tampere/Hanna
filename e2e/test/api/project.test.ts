import { expect } from '@playwright/test';
import { clearData } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { getNewSession, login } from '@utils/page.js';
import { DEV_USER, TEST_USER, TEST_USER_2, UserSessionObject } from '@utils/users.js';

import { User } from '@shared/schema/user.js';

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
  startDate: '2023-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  committees: ['01'],
  sapProjectId: null,
  target: '01',
  palmGrouping: '00',
};

const testProjectObject = (projectId: string, committees: string[], user: User) => ({
  projectId,
  description: 'Test description',
  objectName: 'Test project object',
  objectStage: '01',
  lifecycleState: '01',
  committee: committees[0],
  objectType: '01',
  objectCategory: ['01'],
  objectUsage: ['01'],
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  sapWBSId: null,
  landownership: null,
  locationOnProperty: null,
  objectUserRoles: [],
  palmGrouping: '00',
});

const validProject = (userId: string, projectName = 'Test project') => ({
  projectName,
  description: 'Test description',
  owner: userId,
  startDate: '2021-01-01',
  endDate: '2022-01-01',
  lifecycleState: '01',
  committees: ['01'],
  sapProjectId: null,
  coversMunicipality: false,
  target: '01',
  palmGrouping: '00',
});

test.describe('Project endpoints', () => {
  // TODO use session fixtures
  let devSession: UserSessionObject;
  let investmentFinancialsSession: UserSessionObject;
  let maintenanceFinancialsSession: UserSessionObject;

  test.beforeAll(async ({ browser, modifyPermissions, adminSession }) => {
    investmentFinancialsSession = await login(browser, TEST_USER);
    maintenanceFinancialsSession = await login(browser, DEV_USER);
    devSession = await login(browser, TEST_USER_2);

    await modifyPermissions(TEST_USER, ['investmentProject.write', 'investmentFinancials.write']);
    await modifyPermissions(DEV_USER, ['maintenanceProject.write', 'maintenanceFinancials.write']);

    await adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: TEST_USER_2,
        permissions: [
          'investmentProject.write',
          'investmentFinancials.write',
          'maintenanceProject.write',
          'maintenanceFinancials.write',
          'detailplanProject.write',
        ],
      },
    ]);
    investmentFinancialsSession = await getNewSession(
      browser,
      TEST_USER,
      investmentFinancialsSession.page,
    );
    maintenanceFinancialsSession = await getNewSession(
      browser,
      DEV_USER,
      maintenanceFinancialsSession.page,
    );
    devSession = await getNewSession(browser, TEST_USER_2, devSession.page);
  });

  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
    await clearData();
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
    const user = await devSession.client.user.self.query();

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: validProject(user.id),
    });

    const budgetUpdateInput = {
      projectId: project.projectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          committee: project.committees[0],
        },
      ],
    };

    await devSession.client.investmentProject.updateBudget.mutate(budgetUpdateInput);

    const projectWithNewDates = { ...project, startDate: '2023-01-01', endDate: '2024-01-01' };

    const validationResultWithBudget =
      await devSession.client.investmentProject.upsertValidate.query(projectWithNewDates);

    const projectObject = testProjectObject(project.projectId, project.committees, user);

    await devSession.client.investmentProjectObject.upsert.mutate(projectObject);

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

  test('investment project budget update', async () => {
    const user = await devSession.client.user.self.query();
    const validProjectInput = validProject(user.id);

    const project = await devSession.client.investmentProject.upsert.mutate({
      project: validProjectInput,
    });

    // Project budget (estimates) changed to be sum of project objects' estimates
    const projectObject1 = testProjectObject(project.projectId, project.committees, user);
    const { projectObjectId: objectId1 } =
      await devSession.client.investmentProjectObject.upsert.mutate(projectObject1);

    const projectObject2 = testProjectObject(project.projectId, project.committees, user);
    const { projectObjectId: objectId2 } =
      await devSession.client.investmentProjectObject.upsert.mutate(projectObject2);

    const getBudgetResult = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });

    expect(getBudgetResult).toStrictEqual([]);

    await devSession.client.investmentProjectObject.updateBudget.mutate({
      projectObjectId: objectId1,
      budgetItems: [
        {
          year: 2021,
          estimate: 30000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: project.committees[0],
        },
        {
          year: 2022,
          estimate: 40000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: project.committees[0],
        },
      ],
    });

    await devSession.client.investmentProjectObject.updateBudget.mutate({
      projectObjectId: objectId2,
      budgetItems: [
        {
          year: 2021,
          estimate: 20000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: project.committees[0],
        },
        {
          year: 2022,
          estimate: 20000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: project.committees[0],
        },
      ],
    });

    const updatedBudgetResult = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });

    // Project budget should now show sum of project object estimates
    expect(updatedBudgetResult).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 50000, // Sum from project objects
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        committee: project.committees[0],
      },
      {
        year: 2022,
        budgetItems: {
          estimate: 60000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        committee: project.committees[0],
      },
    ]);

    // Update budget for one project object.
    await devSession.client.investmentProjectObject.updateBudget.mutate({
      projectObjectId: objectId1,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: project.committees[0],
        },
      ],
    });

    const updatedBudgetResult2021 = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });

    // Project budget should reflect the updated sum.
    expect(updatedBudgetResult2021).toStrictEqual([
      {
        year: 2021,
        committee: project.committees[0],
        budgetItems: {
          estimate: 70000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
      },
      {
        year: 2022,
        committee: project.committees[0],
        budgetItems: {
          estimate: 60000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
      },
    ]);
  });

  test('maintenance project budget update', async () => {
    const user = await devSession.client.user.self.query();
    const validProjectInput = validProject(user.id);

    const project = await devSession.client.maintenanceProject.upsert.mutate({
      project: validProjectInput,
    });

    const testMaintenanceProjectObject = (projectId: string, user: User) => ({
      projectId,
      description: 'Test description',
      objectName: 'Test maintenance project object',
      objectStage: '01',
      lifecycleState: '01',
      committee: null,
      objectType: '01',
      objectCategory: ['01'],
      objectUsage: ['01'],
      startDate: '2021-01-01',
      endDate: '2022-01-01',
      sapWBSId: null,
      landownership: null,
      locationOnProperty: null,
      objectUserRoles: [],
      palmGrouping: '00',
    });

    const projectObject1 = testMaintenanceProjectObject(project.projectId, user);
    const { projectObjectId: objectId1 } =
      await devSession.client.maintenanceProjectObject.upsert.mutate(projectObject1);

    const projectObject2 = testMaintenanceProjectObject(project.projectId, user);
    const { projectObjectId: objectId2 } =
      await devSession.client.maintenanceProjectObject.upsert.mutate(projectObject2);

    const getBudgetResult = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });

    expect(getBudgetResult).toStrictEqual([]);

    await devSession.client.maintenanceProjectObject.updateBudget.mutate({
      projectObjectId: objectId1,
      budgetItems: [
        {
          year: 2021,
          estimate: 30000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: null,
        },
        {
          year: 2022,
          estimate: 40000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: null,
        },
      ],
    });

    await devSession.client.maintenanceProjectObject.updateBudget.mutate({
      projectObjectId: objectId2,
      budgetItems: [
        {
          year: 2021,
          estimate: 20000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: null,
        },
        {
          year: 2022,
          estimate: 20000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: null,
        },
      ],
    });

    const updatedBudgetResult = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });

    // Project budget should now show sum of project object estimates
    expect(updatedBudgetResult).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 50000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        committee: null,
      },
      {
        year: 2022,
        budgetItems: {
          estimate: 60000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        committee: null,
      },
    ]);

    await devSession.client.maintenanceProjectObject.updateBudget.mutate({
      projectObjectId: objectId1,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          amount: null,
          contractPrice: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
          committee: null,
        },
      ],
    });

    const updatedBudgetResult2021 = await devSession.client.project.getBudget.query({
      projectId: project.projectId,
    });
    expect(updatedBudgetResult2021).toStrictEqual([
      {
        year: 2021,
        budgetItems: {
          estimate: 70000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        committee: null,
      },
      {
        year: 2022,
        budgetItems: {
          estimate: 60000,
          amount: null,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        committee: null,
      },
    ]);
  });

  test('add project relation', async () => {
    const user = await devSession.client.user.self.query();
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
    const user = await devSession.client.user.self.query();
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

  test('add project for entire municipality', async () => {
    const user = await devSession.client.user.self.query();
    const baseProjectInput = {
      ...validProject(user.id, 'Invalid project'),
      coversMunicipality: true,
    };

    const investmentProject = await devSession.client.investmentProject.upsert.mutate({
      project: baseProjectInput,
    });
    const maintenanceProject = await devSession.client.maintenanceProject.upsert.mutate({
      project: baseProjectInput,
    });

    expect(investmentProject.coversMunicipality).toBe(true);
    expect(maintenanceProject.coversMunicipality).toBe(true);

    const geom = makePoint(326673.014866, 6823373.604181, 'EPSG:3067');

    // Cannot update geom for project that covers entire municipality
    await expect(
      devSession.client.investmentProject.upsert.mutate({
        project: { ...investmentProject, geom: JSON.stringify(geom) },
      }),
    ).rejects.toThrowError('Query violates a check integrity constraint.');
    await expect(
      devSession.client.maintenanceProject.upsert.mutate({
        project: { ...maintenanceProject, geom: JSON.stringify(geom) },
      }),
    ).rejects.toThrowError('Query violates a check integrity constraint.');

    // Can update geometry if coversMunicipality is false
    await expect(
      devSession.client.investmentProject.upsert.mutate({
        project: { ...investmentProject, coversMunicipality: false, geom: JSON.stringify(geom) },
      }),
    ).resolves.not.toThrowError();
    await expect(
      devSession.client.maintenanceProject.upsert.mutate({
        project: { ...maintenanceProject, coversMunicipality: false, geom: JSON.stringify(geom) },
      }),
    ).resolves.not.toThrowError();
  });

  test('Add ongoing maintenance project', async () => {
    const user = await devSession.client.user.self.query();
    const projectInput = validProject(user.id, 'Ongoing maintenance project');
    projectInput.endDate = 'infinity';

    const maintenanceProject = await devSession.client.maintenanceProject.upsert.mutate({
      project: projectInput,
    });

    await expect(
      devSession.client.investmentProject.upsert.mutate({
        project: projectInput,
      }),
    ).rejects.toThrowError();
    await expect(
      devSession.client.detailplanProject.upsert.mutate({
        project: projectInput,
      }),
    ).rejects.toThrowError();

    expect(maintenanceProject.endDate).toBe('infinity');
  });

  /** Used to check that output validation doesn't fail if schema is changed */
  test('search projects with different zoom levels', async () => {
    const user = await devSession.client.user.self.query();
    const projectInput = validProject(user.id, 'Search project');
    const project = await devSession.client.investmentProject.upsert.mutate({
      project: {
        ...projectInput,
        geom: JSON.stringify(makePoint(328425.0, 6822340.0, 'EPSG:3067')),
      },
    });

    const searchResults1 = await devSession.client.project.search.query({
      text: 'Search project',
      filters: {},
      onlyCoversMunicipality: false,
      map: {
        extent: [326982.0, 6821409.0, 329869.0, 6823289.0],
        zoom: 11,
      },
    });

    const searchResults2 = await devSession.client.project.search.query({
      text: 'Search project',
      filters: {},
      onlyCoversMunicipality: false,
      map: {
        extent: [328425.0, 6822340.0, 328425.0, 6822340.0],
        zoom: 8,
      },
    });

    expect(searchResults1.projects).toHaveLength(1);
    expect(searchResults1.projects[0].projectId).toBe(project.projectId);

    expect(searchResults2.projects).toHaveLength(1);
    expect(searchResults2.projects[0].projectId).toBe(project.projectId);
  });

  test('Project date shift', async () => {
    const user = await devSession.client.user.self.query();
    // Original start year is 2021
    const projectInput = validProject(user.id, 'Project date shift');
    const project = await devSession.client.investmentProject.upsert.mutate({
      project: projectInput,
    });

    const projectObjectData = testProjectObject(project.projectId, project.committees, user);
    const { projectId, projectObjectId } =
      await devSession.client.investmentProjectObject.upsert.mutate(projectObjectData);

    await devSession.client.investmentProject.updateBudget.mutate({
      projectId: project.projectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          committee: project.committees[0],
        },
        {
          year: 2022,
          estimate: 60000,
          committee: project.committees[0],
        },
      ],
    });

    await devSession.client.investmentProjectObject.updateBudget.mutate({
      projectObjectId: projectObjectId,
      budgetItems: [
        {
          year: 2021,
          estimate: 50000,
          amount: 45000,
          contractPrice: 47000,
          committee: project.committees[0],
        },
        {
          year: 2022,
          estimate: 60000,
          amount: 55000,
          contractPrice: 58000,
          committee: project.committees[0],
        },
      ],
    });

    await devSession.client.project.shiftProjectDateWithYears.mutate({
      projectId: project.projectId,
      newStartYear: 2023,
    });

    const projectObject = await devSession.client.investmentProjectObject.get.query({
      projectId,
      projectObjectId,
    });

    await expect(
      devSession.client.investmentProject.get.query({ projectId: project.projectId }),
    ).resolves.toMatchObject({
      ...project,
      startDate: project.startDate.replace('2021', '2023'),
      endDate: project.endDate.replace('2022', '2024'),
    });

    await expect(
      devSession.client.investmentProjectObject.get.query({
        projectId,
        projectObjectId,
      }),
    ).resolves.toMatchObject({
      ...projectObject,
      startDate: projectObject.startDate.replace('2021', '2023'),
      endDate: projectObject.endDate.replace('2022', '2024'),
    });

    await expect(devSession.client.project.getBudget.query({ projectId })).resolves.toStrictEqual([
      {
        budgetItems: {
          estimate: 50000,
          amount: 45000,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        year: 2023,
        committee: project.committees[0],
      },
      {
        budgetItems: {
          estimate: 60000,
          amount: 55000,
          forecast: null,
          kayttosuunnitelmanMuutos: null,
        },
        year: 2024,
        committee: project.committees[0],
      },
    ]);
  });
});
