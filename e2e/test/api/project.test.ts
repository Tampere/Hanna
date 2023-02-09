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

test.describe('Project endpoints', () => {
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('project geometry edit', async () => {
    // There should be at least one user because this is executed after login
    const [user] = await client.user.getAll.query();

    const project = await client.project.upsert.mutate({
      projectName: 'Test project',
      description: 'Test description',
      owner: user.id,
      personInCharge: user.id,
      startDate: '2021-01-01',
      endDate: '2022-01-01',
      lifecycleState: '01',
      projectType: '01',
      sapProjectId: null,
    });

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
});
