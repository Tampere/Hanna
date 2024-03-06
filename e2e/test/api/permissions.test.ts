// TRPC api tests for permissions
import test, { expect } from '@playwright/test';
import { User } from '@shared/schema/userPermissions';
import { login, refreshSession } from '@utils/page';
import {
  ADMIN_USER,
  DEV_USER,
  TEST_USER,
  UserSessionObject,
  clearUserPermissions,
} from '@utils/users';

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

function findUserByEmail(users: readonly User[], email: string) {
  return users.find((user) => user.userEmail === email);
}

test.describe('permission testing', () => {
  let adminSession: UserSessionObject;
  let devSession: UserSessionObject;
  let testSession: UserSessionObject;

  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    devSession = await login(browser, DEV_USER);
    testSession = await login(browser, TEST_USER);

    expect((await adminSession.client.user.self.query()).email).toBe(ADMIN_USER);
    expect((await devSession.client.user.self.query()).email).toBe(DEV_USER);
    expect((await testSession.client.user.self.query()).email).toBe(TEST_USER);
  });

  test.afterEach(async ({ browser }) => {
    await clearUserPermissions(adminSession.client, [DEV_USER, TEST_USER]);

    devSession = await refreshSession(browser, DEV_USER, devSession.page);
    testSession = await refreshSession(browser, TEST_USER, testSession.page);
  });

  test('without write permission, projects cannot be created', async () => {
    const user = await testSession.client.user.self.query();
    const newProject = validProject(user.id);

    await expect(
      testSession.client.investmentProject.upsert.mutate({ project: newProject })
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('non-admin users cannot grant permissions for any users', async () => {
    const users = await adminSession.client.userPermissions.getAll.query();

    await expect(
      testSession.client.userPermissions.setPermissions.mutate([
        {
          userId: findUserByEmail(users, ADMIN_USER).userId,
          permissions: ['investmentProject.write'],
        },
      ])
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin can grant permissions for users to create new projects', async ({ browser }) => {
    await expect(
      adminSession.client.userPermissions.setPermissions.mutate([
        {
          userId: DEV_USER,
          permissions: ['investmentProject.write'],
        },
        {
          userId: TEST_USER,
          permissions: ['investmentProject.write'],
        },
      ]),
      'admin can grant permissions for users to create new projects'
    ).resolves.not.toThrow();

    devSession = await refreshSession(browser, DEV_USER, devSession.page);
    const user = await devSession.client.user.self.query();
    const newProject = validProject(DEV_USER);

    let project = await devSession.client.investmentProject.upsert.mutate({ project: newProject });

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
      })
    );

    await expect(
      testSession.client.investmentProject.upsert.mutate({
        project: {
          ...project,
          description: 'Updated description',
        },
      }),
      'non-owner cannot update the project'
    ).rejects.toThrowError('error.insufficientPermissions');

    const newProjectObject = await devSession.client.projectObject.upsert.mutate({
      projectId: testProjectId,
      objectName: 'Test project object',
      description: 'Test project object description',
      suunnitteluttajaUser: user.id,
      rakennuttajaUser: user.id,
      lifecycleState: '01',
      objectType: ['01'],
      objectCategory: ['01'],
      objectUsage: ['01'],
      startDate: '2021-01-01',
      endDate: '2022-01-01',
      objectUserRoles: [],
    });

    expect(
      newProjectObject.projectObjectId,
      'owner can create project objects to project'
    ).toBeTruthy();

    await devSession.client.project.updatePermissions.mutate({
      projectId: testProjectId,
      permissions: [{ userId: TEST_USER, canWrite: true }],
    });

    project = await testSession.client.investmentProject.get.query({ projectId: testProjectId });

    const updates = { description: 'Updated description by other user' };
    const updatedProject = await testSession.client.investmentProject.upsert.mutate({
      project: { ...project, ...updates },
    });

    expect(updatedProject.description, 'project was updated by granted user').toBe(
      updates.description
    );

    const newProjectObject2 = await testSession.client.projectObject.upsert.mutate({
      projectId: testProjectId,
      objectName: 'Test project object 2',
      description: 'Test project object description 2',
      suunnitteluttajaUser: user.id,
      rakennuttajaUser: user.id,
      lifecycleState: '01',
      objectType: ['01'],
      objectCategory: ['01'],
      objectUsage: ['01'],
      startDate: '2021-01-01',
      endDate: '2022-01-01',
      objectUserRoles: [],
    });

    expect(
      newProjectObject2.projectObjectId,
      'granted user can create project objects to project'
    ).toBeTruthy();
  });

  test('owner changing', async ({ browser }) => {
    await expect(
      adminSession.client.userPermissions.setPermissions.mutate([
        {
          userId: TEST_USER,
          permissions: ['investmentProject.write'],
        },
      ])
    ).resolves.not.toThrow();
    testSession = await refreshSession(browser, TEST_USER, testSession.page);

    const user = await testSession.client.user.self.query();
    const newProject = validProject(user.id);

    expect(newProject.owner).toBe(user.id);
    // XXX: owner can be changed to another user with option to maintain write permission
    const updates = { owner: DEV_USER, personInCharge: user.id };
    const project = await testSession.client.investmentProject.upsert.mutate({
      project: { ...newProject, ...updates },
    });
    expect(project.owner).toBe(DEV_USER);
  });
  // XXX: owner can be changed to another user without option to maintain write permission

  test('non-owner cannot delete the project', async () => {
    const user = await adminSession.client.user.self.query();
    const newProject = validProject(user.id);

    expect(newProject.owner).toBe(user.id);
    const project = await adminSession.client.investmentProject.upsert.mutate({
      project: newProject,
    });
    await expect(
      testSession.client.project.delete.mutate({
        projectId: project.projectId,
      })
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('owner can delete the project', async ({ browser }) => {
    await expect(
      adminSession.client.userPermissions.setPermissions.mutate([
        {
          userId: TEST_USER,
          permissions: ['investmentProject.write'],
        },
      ])
    ).resolves.not.toThrow();
    testSession = await refreshSession(browser, TEST_USER, testSession.page);

    const user = await testSession.client.user.self.query();
    const newProject = validProject(user.id);
    expect(newProject.owner).toBe(user.id);

    const { projectId } = await testSession.client.investmentProject.upsert.mutate({
      project: newProject,
    });

    const deletedProject = await testSession.client.project.delete.mutate({
      projectId: projectId,
    });

    expect(deletedProject.projectId).toEqual(projectId);
  });
});
