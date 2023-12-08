// TRPC api tests for permissions
import test, { expect } from '@playwright/test';
import { User } from '@shared/schema/userPermissions';
import { changeUser, login } from '@utils/page';
import { client } from '@utils/trpc';
import { ADMIN_USER, DEV_USER, TEST_USER, clearUserPermissions } from '@utils/users';

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
  test('without write permission, projects cannot be created', async ({ page }) => {
    await login(page, ADMIN_USER);
    await clearUserPermissions(DEV_USER, TEST_USER);
    await changeUser(page, TEST_USER);
    const user = await client.user.self.query();
    expect(user.email).toBe(TEST_USER);

    const newProject = validProject(user.id);

    await expect(
      client.investmentProject.upsert.mutate({ project: newProject })
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('non-admin users cannot grant permissions for any users', async ({ page }) => {
    await login(page, ADMIN_USER);
    const users = await client.userPermissions.getAll.query();

    await changeUser(page, DEV_USER);
    await expect(
      client.userPermissions.setPermissions.mutate([
        {
          userId: findUserByEmail(users, ADMIN_USER).userId,
          permissions: ['investmentProject.write'],
        },
      ])
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin can grant permissions for users to create new projects', async ({ page }) => {
    await login(page, ADMIN_USER);
    let user = await client.user.self.query();
    expect(user.email).toBe(ADMIN_USER);

    await expect(
      client.userPermissions.setPermissions.mutate([
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

    await changeUser(page, DEV_USER);
    user = await client.user.self.query();

    const newProject = validProject(user.id);

    let project = await client.investmentProject.upsert.mutate({ project: newProject });

    expect(project.projectId, 'project was created').toBeTruthy();
    const testProjectId = project.projectId;

    const updatedProj = await client.investmentProject.upsert.mutate({
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

    await changeUser(page, TEST_USER);
    await expect(
      client.investmentProject.upsert.mutate({
        project: {
          ...project,
          description: 'Updated description',
        },
      }),
      'non-owner cannot update the project'
    ).rejects.toThrowError('error.insufficientPermissions');

    await changeUser(page, DEV_USER);
    const newProjectObject = await client.projectObject.upsert.mutate({
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

    await changeUser(page, DEV_USER);

    await client.project.updatePermissions.mutate({
      projectId: testProjectId,
      permissions: [{ userId: TEST_USER, canWrite: true }],
    });

    await changeUser(page, TEST_USER);

    project = await client.investmentProject.get.query({ projectId: testProjectId });

    const updates = { description: 'Updated description by other user' };
    const updatedProject = await client.investmentProject.upsert.mutate({
      project: { ...project, ...updates },
    });

    expect(updatedProject.description, 'project was updated by granted user').toBe(
      updates.description
    );

    const newProjectObject2 = await client.projectObject.upsert.mutate({
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

  test('owner changing', async ({ page }) => {
    await changeUser(page, TEST_USER);
    const user = await client.user.self.query();
    expect(user.email).toBe(TEST_USER);

    const newProject = validProject(user.id);

    expect(newProject.owner).toBe(user.id);
    // XXX: owner can be changed to another user with option to maintain write permission
    const updates = { owner: DEV_USER, personInCharge: user.id };
    const project = await client.investmentProject.upsert.mutate({
      project: { ...newProject, ...updates },
    });
    expect(project.owner).toBe(DEV_USER);

    // XXX: owner can be changed to another user without option to maintain write permission
    // XXX: non-owner cannot delete the project
    // XXX: owner can delete the project
  });
});
