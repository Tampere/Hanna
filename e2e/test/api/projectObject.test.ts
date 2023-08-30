import test, { expect } from '@playwright/test';
import { User } from '@shared/schema/user';
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
  suunnittelluttajaUser: user.id,
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
  });
});
