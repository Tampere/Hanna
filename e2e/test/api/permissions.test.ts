// TRPC api tests for permissions
import test, { expect } from '@playwright/test';
import { User } from '@shared/schema/userPermissions';
import { changeUser, login, logout } from '@utils/page';
import { client } from '@utils/trpc';

const ADMIN_USER = 'admin@localhost';
const DEV_USER = 'dev@localhost';
const TEST_USER = 'test@localhost';

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
    await login(page, DEV_USER);
    const user = await client.user.self.query();
    expect(user.email).toBe(DEV_USER);

    const newProject = validProject(user.id);

    await expect(client.investmentProject.upsert.mutate(newProject)).rejects.toThrowError(
      'error.insufficientPermissions'
    );
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
    const user = await client.user.self.query();
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
    const newProject = validProject(user.id);

    const project = await client.investmentProject.upsert.mutate(newProject);
    expect(project.id, 'project was created').toBeTruthy();
    const testProjectId = project.id;

    const updatedProj = await client.investmentProject.upsert.mutate({
      ...project,
      description: 'Updated description',
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
        ...project,
        description: 'Updated description',
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
    });

    expect(newProjectObject.id, 'owner can create project objects to project').toBeTruthy();

    await client.project.setPermissions.mutate({
      projectId: testProjectId,
      entries: [
        {
          userId: TEST_USER,
          permissions: ['investmentProject.write'],
        },
      ],
    });

    await changeUser(page, TEST_USER);
    const project = await client.investmentProject.get.query({ id: testProjectId });
    const updatedProject = await client.investmentProject.upsert.mutate({
      ...project,
      description: 'Updated description by other user',
    });
    expect(updatedProj.description, 'project was updated by granted user').toBe(
      'Updated description by other user'
    );

    // XXX: granted users can edit the project
    // XXX: granted users can create project object etc for the project

    // XXX: owner can be changed to another user with option to maintain write permission

    // XXX: non-owner cannot delete the project
    // XXX: owner can delete the project
  });

  // XXX: only users that have financial permissions can modify the financials
  test('only user that has financial permissions can modify the financials', async ({ page }) => {
    await login(page, 'admin@localhost');
  });
});
