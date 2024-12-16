import { clearUserSavedSearchFilters } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { TEST_USER } from '@utils/users.js';
import { expect } from 'playwright/test';

import { UserSavedSearchFilter } from '@shared/schema/userSavedSearchFilters.js';

const projectSearchFilter: Omit<UserSavedSearchFilter, 'projectObjectSearch' | 'worktableSearch'> =
  {
    filterName: 'Project Search',
    projectSearch: {
      dateRange: { startDate: '2021-01-01', endDate: '2021-12-31' },
      filters: { investmentProject: { committees: ['01'] } },
      owners: [TEST_USER],
      includeWithoutGeom: false,
      onlyCoversMunicipality: false,
      text: 'project',
      lifecycleStates: ['01'],
    },
  };

const projectObjectSearchFilter: Omit<UserSavedSearchFilter, 'projectSearch' | 'worktableSearch'> =
  {
    filterName: 'Project Object Search',
    projectObjectSearch: {
      projectName: 'project',
      includeWithoutGeom: false,
      objectCategories: ['01'],
      objectParticipantUser: TEST_USER,
      objectStages: ['01'],
      objectTypes: ['01'],
      objectUsages: ['01'],
      projectObjectName: 'object',
      rakennuttajaUsers: [TEST_USER],
      suunnitteluttajaUsers: [TEST_USER],
      dateRange: { startDate: '2021-01-01', endDate: '2021-12-31' },
      lifecycleStates: ['01'],
    },
  };

const worktableSearchFilter: Omit<UserSavedSearchFilter, 'projectObjectSearch' | 'projectSearch'> =
  {
    filterName: 'Worktable Search',
    worktableSearch: {
      committee: ['01'],
      company: ['01'],
      lifecycleState: ['01'],
      objectCategory: ['01'],
      objectStartDate: '2021-01-01',
      objectEndDate: '2021-12-31',
      objectParticipantUser: TEST_USER,
      objectStage: ['01'],
      objectUsage: ['01'],
      objectType: ['01'],
      projectName: 'project',
      projectObjectName: 'object',
      projectTarget: ['01'],
      rakennuttajaUsers: [TEST_USER],
      suunnitteluttajaUsers: [TEST_USER],
    },
  };

test.describe('Saved search filters', () => {
  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
  });

  test.afterEach(async () => {
    await clearUserSavedSearchFilters();
  });

  test('can be created', async ({ testSession }) => {
    const { client } = testSession;

    const { filterId: projectFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(projectSearchFilter);
    const { filterId: projectObjectFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(projectObjectSearchFilter);
    const { filterId: worktableFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(worktableSearchFilter);

    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'projectSearch' }),
    ).resolves.toEqual([{ ...projectSearchFilter, filterId: projectFilterId }]);
    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'projectObjectSearch' }),
    ).resolves.toEqual([{ ...projectObjectSearchFilter, filterId: projectObjectFilterId }]);
    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'worktableSearch' }),
    ).resolves.toEqual([{ ...worktableSearchFilter, filterId: worktableFilterId }]);
  });

  test('can be edited', async ({ testSession }) => {
    const { client } = testSession;

    const { filterId: projectFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(projectSearchFilter);
    const { filterId: projectObjectFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(projectObjectSearchFilter);
    const { filterId: worktableFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(worktableSearchFilter);

    await client.user.upsertSavedSearchFilters.mutate({
      ...projectSearchFilter,
      filterId: projectFilterId,
      projectSearch: {
        ...projectSearchFilter.projectSearch,
        text: 'new project',
      },
    });

    await client.user.upsertSavedSearchFilters.mutate({
      ...projectObjectSearchFilter,
      filterId: projectObjectFilterId,
      projectObjectSearch: {
        ...projectObjectSearchFilter.projectObjectSearch,
        projectName: 'new project',
      },
    });

    await client.user.upsertSavedSearchFilters.mutate({
      ...worktableSearchFilter,
      filterId: worktableFilterId,
      worktableSearch: {
        ...worktableSearchFilter.worktableSearch,
        projectName: 'new project',
      },
    });

    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'projectSearch' }),
    ).resolves.toEqual([
      {
        ...{
          ...projectSearchFilter,
          projectSearch: { ...projectSearchFilter.projectSearch, text: 'new project' },
        },
        filterId: projectFilterId,
      },
    ]);
    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'projectObjectSearch' }),
    ).resolves.toEqual([
      {
        ...{
          ...projectObjectSearchFilter,
          projectObjectSearch: {
            ...projectObjectSearchFilter.projectObjectSearch,
            projectName: 'new project',
          },
        },
        filterId: projectObjectFilterId,
      },
    ]);
    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'worktableSearch' }),
    ).resolves.toEqual([
      {
        ...{
          ...worktableSearchFilter,
          worktableSearch: { ...worktableSearchFilter.worktableSearch, projectName: 'new project' },
        },
        filterId: worktableFilterId,
      },
    ]);
  });

  test('can be deleted', async ({ testSession }) => {
    const { client } = testSession;

    const { filterId: projectFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(projectSearchFilter);
    const { filterId: projectObjectFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(projectObjectSearchFilter);
    const { filterId: worktableFilterId } =
      await client.user.upsertSavedSearchFilters.mutate(worktableSearchFilter);

    await client.user.deleteSavedSearchFilter.mutate({ filterId: projectFilterId });
    await client.user.deleteSavedSearchFilter.mutate({ filterId: projectObjectFilterId });
    await client.user.deleteSavedSearchFilter.mutate({ filterId: worktableFilterId });

    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'projectSearch' }),
    ).resolves.toEqual([]);
    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'projectObjectSearch' }),
    ).resolves.toEqual([]);
    await expect(
      client.user.getSavedSearchFilters.query({ filterType: 'worktableSearch' }),
    ).resolves.toEqual([]);
  });
});
