// TRPC api tests for permissions
import { expect } from '@playwright/test';
import { clearData } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { ADMIN_USER, DEV_USER, TEST_USER } from '@utils/users.js';

import type { User } from '@shared/schema/userPermissions.js';

const validProject = (userId: string) => ({
  projectName: 'Test project',
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

function findUserByEmail(users: readonly User[], email: string) {
  return users.find((user) => user.userEmail === email);
}

test.describe('permission testing', () => {
  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
    await clearData();
  });

  test('without write permission, projects cannot be created', async ({ testSession }) => {
    const newProject = validProject(testSession.user.id);

    await expect(
      testSession.client.investmentProject.upsert.mutate({ project: newProject }),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('non-admin users cannot grant permissions for any users', async ({
    adminSession,
    testSession,
  }) => {
    const users = await adminSession.client.userPermissions.getByName.query();

    await expect(
      testSession.client.userPermissions.setPermissions.mutate([
        {
          userId: findUserByEmail(users, ADMIN_USER).userId,
          permissions: ['investmentProject.write'],
        },
      ]),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin can grant permissions for users to create new projects', async ({
    devSession,
    testSession,
    modifyPermissions,
  }) => {
    await expect(
      modifyPermissions(DEV_USER, ['investmentProject.write']),
      'admin can grant permissions for users to create new projects',
    ).resolves.not.toThrow();
    await expect(modifyPermissions(TEST_USER, ['investmentProject.write'])).resolves.not.toThrow();

    const newProject = validProject(DEV_USER);

    let project = await devSession.client.investmentProject.upsert.mutate({
      project: newProject,
    });

    expect(project.projectId, 'project was created').toBeTruthy();
    const testProjectId = project.projectId;

    const updatedProj = await devSession.client.investmentProject.upsert.mutate({
      project: {
        ...project,
        description: 'Updated description',
      },
    });

    expect(updatedProj, 'project was updated').toEqual(
      expect.objectContaining({
        ...newProject,
        description: 'Updated description',
      }),
    );

    await expect(
      testSession.client.investmentProject.upsert.mutate({
        project: {
          ...project,
          description: 'Updated description',
        },
      }),
      'non-owner cannot update the project',
    ).rejects.toThrowError('error.insufficientPermissions');

    const newProjectObject = await devSession.client.investmentProjectObject.upsert.mutate({
      projectId: testProjectId,
      objectName: 'Test project object',
      description: 'Test project object description',
      committee: project.committees[0],
      lifecycleState: '01',
      objectType: '01',
      objectCategory: ['01'],
      objectUsage: ['01'],
      objectStage: '01',
      startDate: '2021-01-01',
      endDate: '2022-01-01',
      objectUserRoles: [],
      palmGrouping: '00',
    });

    expect(
      newProjectObject.projectObjectId,
      'owner can create project objects to project',
    ).toBeTruthy();

    await devSession.client.project.updatePermissions.mutate({
      projectId: testProjectId,
      permissions: [{ userId: TEST_USER, canWrite: true }],
    });

    project = await testSession.client.investmentProject.get.query({
      projectId: testProjectId,
    });

    const updates = { description: 'Updated description by other user' };
    const updatedProject = await testSession.client.investmentProject.upsert.mutate({
      project: { ...project, ...updates },
    });

    expect(updatedProject.description, 'project was updated by granted user').toBe(
      updates.description,
    );

    const newProjectObject2 = await testSession.client.investmentProjectObject.upsert.mutate({
      projectId: testProjectId,
      objectName: 'Test project object 2',
      description: 'Test project object description 2',
      committee: project.committees[0],
      lifecycleState: '01',
      objectStage: '01',
      objectType: '01',
      objectCategory: ['01'],
      objectUsage: ['01'],
      startDate: '2021-01-01',
      endDate: '2022-01-01',
      objectUserRoles: [],
      palmGrouping: '00',
    });

    expect(
      newProjectObject2.projectObjectId,
      'granted user can create project objects to project',
    ).toBeTruthy();
  });

  test('owner changing', async ({ testSession, modifyPermissions }) => {
    await expect(modifyPermissions(TEST_USER, ['investmentProject.write'])).resolves.not.toThrow();

    const newProject = validProject(testSession.user.id);

    expect(newProject.owner).toBe(testSession.user.id);
    // XXX: owner can be changed to another user with option to maintain write permission
    const updates = { owner: DEV_USER };
    const project = await testSession.client.investmentProject.upsert.mutate({
      project: { ...newProject, ...updates },
    });
    expect(project.owner).toBe(DEV_USER);
  });
  // XXX: owner can be changed to another user without option to maintain write permission

  test('non-owner cannot delete the project', async ({ adminSession, testSession }) => {
    const newProject = validProject(adminSession.user.id);

    expect(newProject.owner).toBe(adminSession.user.id);
    const project = await adminSession.client.investmentProject.upsert.mutate({
      project: newProject,
    });
    await expect(
      testSession.client.project.delete.mutate({
        projectId: project.projectId,
      }),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('owner can delete the project', async ({ testSession, modifyPermissions }) => {
    await expect(modifyPermissions(TEST_USER, ['investmentProject.write'])).resolves.not.toThrow();

    const newProject = validProject(testSession.user.id);
    expect(newProject.owner).toBe(testSession.user.id);

    const { projectId } = await testSession.client.investmentProject.upsert.mutate({
      project: newProject,
    });

    const deletedProject = await testSession.client.project.delete.mutate({
      projectId: projectId,
    });

    expect(deletedProject.project.projectId).toEqual(projectId);
  });
});
