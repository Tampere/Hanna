import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

function makePoint(lon: number, lat: number, srid: string) {
  return {
    type: 'Point',
    crs: { type: 'name', properties: { name: srid } },
    coordinates: [lon, lat],
  };
}

test.describe('Project endpoints', () => {
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('project search', async () => {
    const result = await client.project.search.query({ text: '' });
    expect(result).toBeDefined();
  });

  test('project geometry edit', async () => {
    const project = await client.project.upsert.mutate({
      projectName: 'Test project',
      description: 'Test description',
      startDate: '2021-01-01',
      endDate: '2022-01-01',
    });

    const point = makePoint(24487416.69375355, 6821004.272996133, 'EPSG:3878');

    const edit = await client.project.updateGeometry.mutate({
      id: project.id,
      geometry: JSON.stringify(point),
    });

    expect(edit.id).toBe(project.id);
    expect(JSON.parse(edit.geometry)).toStrictEqual(point);
  });

  test('delete project(s)', async () => {
    let projects = await client.project.search.query({ text: '' });
    expect(projects.length).toBeDefined();

    await Promise.all(projects.map((project) => client.project.delete.mutate({ id: project.id })));
    projects = await client.project.search.query({ text: '' });
    expect(projects.length).toEqual(0);
  });
});
