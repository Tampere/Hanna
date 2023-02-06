import { expect, Page, test } from '@playwright/test';
import type { UpsertProject } from '@shared/schema/project';
import { sleep } from '@shared/utils';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

const keskustoriGeom = {
  type: 'Polygon',
  coordinates: [
    [
      [327603.111449048, 6822563.296219701],
      [327591.111449048, 6822541.546219701],
      [327619.861449048, 6822543.796219701],
      [327603.111449048, 6822563.296219701],
    ],
  ],
  crs: {
    type: 'name',
    properties: {
      name: 'EPSG:3067',
    },
  },
};

function geometryPayload(projectId: string, geometry: object) {
  return {
    id: projectId,
    features: JSON.stringify([
      {
        type: 'Feature',
        geometry,
      },
    ]),
  };
}

const lifecycleStateToText = {
  '01': 'Aloittamatta',
  '02': 'Käynnissä',
  '03': 'Valmis',
  '04': 'Odottaa',
} as const;

async function createProject(page: Page, project: UpsertProject) {
  // Go to the new project page
  await page.getByRole('link', { name: 'Luo uusi hanke' }).click();
  await expect(page).toHaveURL('https://localhost:1443/hanke/luo');

  // Fill in the project data and save the project
  await page.locator('input[name="projectName"]').fill(project.projectName);
  await page.locator('textarea[name="description"]').fill(project.description);
  await page.locator('input[name="startDate"]').fill(project.startDate);
  await page.locator('input[name="endDate"]').fill(project.endDate);
  const lifecycleText = lifecycleStateToText[project.lifecycleState];
  if (lifecycleText) {
    await page.getByLabel('Elinkaaren tila').click();
    await page.getByRole('option', { name: lifecycleText }).click();
  }

  await page.getByLabel('Hanketyyppi').click();
  await page.getByRole('option', { name: 'Investointihanke' }).click();

  await page.getByRole('button', { name: 'Lisää hanke' }).click();

  // URL should include the newly created project ID, parse it from the URL
  await expect(page).toHaveURL(/https:\/\/localhost:1443\/hanke\/[0-9a-f-]+/);
  const projectId = page.url().split('/').at(-1);

  await client.project.updateGeometry.mutate(geometryPayload(projectId, keskustoriGeom));

  // Go back to the front page
  await page.getByRole('link', { name: 'Hankkeet' }).click();
  await expect(page).toHaveURL('https://localhost:1443/hankkeet');

  // Return the created project with ID
  return {
    ...project,
    id: projectId,
  } as UpsertProject;
}

async function deleteProject(page: Page, projectId: string) {
  // Go to the project page
  await page.goto(`https://localhost:1443/hanke/${projectId}`);

  // Delete the project
  await page.getByRole('button', { name: 'Poista hanke' }).click();
  await page.getByRole('button', { name: 'Poista' }).click();
  await expect(page).toHaveURL('https://localhost:1443/hankkeet');

  // Expect the project page to not exist anymore
  await page.goto(`https://localhost:1443/hanke/${projectId}`);
  await expect(page.getByText('Hanketta ei löytynyt')).toBeVisible();
  await page.goto('https://localhost:1443/hankkeet');
}

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Create a project', async ({ page }) => {
    let project: UpsertProject = {
      projectName: `Testihanke ${Date.now()}`,
      description: 'Testikuvaus',
      startDate: '1.12.2022',
      endDate: '28.2.2023',
    };

    project = { ...project, ...(await createProject(page, project)) };

    // Click on the new project button to go back to the project page
    await page.locator(`text=${project.projectName}`).click();
    await expect(page).toHaveURL(`https://localhost:1443/hanke/${project.id}`);

    // Check that all fields still have the same values
    await expect(page.locator('input[name="projectName"]')).toHaveValue(project.projectName);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(project.description);
    await expect(page.locator('input[name="startDate"]')).toHaveValue(project.startDate);
    await expect(page.locator('input[name="endDate"]')).toHaveValue(project.endDate);

    await deleteProject(page, project.id);
  });

  test('Delete project', async ({ page }) => {
    const project = await createProject(page, {
      projectName: 'Tuhottava hanke',
      description: 'Testikuvaus',
      startDate: '1.12.2022',
      endDate: '31.12.2022',
    });

    await deleteProject(page, project.id);
  });

  test('Project search', async ({ page }) => {
    const projectA = await createProject(page, {
      projectName: `Hakutesti ${Date.now()}`,
      description: 'Myös kuvauksen teksti otetaan haussa huomioon',
      startDate: '1.12.2022',
      endDate: '28.2.2023',
      lifecycleState: '01',
    });

    const projectB = await createProject(page, {
      projectName: `Toinen hakutesti ${Date.now()}`,
      description: 'Tässä on toisen testihankkeen kuvaus',
      startDate: '1.1.2001',
      endDate: '31.12.2099',
      lifecycleState: '01',
    });

    const projectC = await createProject(page, {
      projectName: `Kolmas hakutesti ${Date.now()}`,
      description: 'Tässä on kolmannen testihankkeen kuvaus',
      startDate: '1.1.2001',
      endDate: '31.12.2099',
      lifecycleState: '02',
    });

    // Search for projectA - projectB should not be in results
    await page.fill('label:has-text("Haku")', 'huomio');
    // Delay required because of debouncing
    await sleep(1000);

    let searchResults = await page.locator("div[aria-label='Hakutulokset'] > a").allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectA.projectName)) &&
        searchResults.every((result) => !result.includes(projectB.projectName))
    ).toBe(true);

    // Search for projectB - projectA should not be in results
    await page.fill('label:has-text("Haku")', 'kuvaus');
    await sleep(1000);
    searchResults = await page.locator("div[aria-label='Hakutulokset'] > a").allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectB.projectName)) &&
        searchResults.every((result) => !result.includes(projectA.projectName))
    ).toBe(true);

    // Search for both projects
    await page.fill('label:has-text("Haku")', 'hakutesti');
    await sleep(1000);
    searchResults = await page.locator("div[aria-label='Hakutulokset'] > a").allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectB.projectName)) &&
        searchResults.some((result) => result.includes(projectA.projectName))
    ).toBe(true);

    // Search for other projects (only prefixes should be matched - no other substrings!)
    await page.fill('label:has-text("Haku")', 'akutesti');
    await sleep(1000);
    searchResults = await page.locator("div[aria-label='Hakutulokset'] > a").allTextContents();
    expect(
      searchResults.every((result) => !result.includes(projectB.projectName)) &&
        searchResults.every((result) => !result.includes(projectA.projectName))
    ).toBe(true);

    // search with elinkaaren tila filter
    await page.fill('label:has-text("Haku")', '');
    await page.getByLabel('Elinkaaren tila').press('ArrowDown');
    await page.getByRole('option', { name: 'Aloittamatta' }).getByRole('checkbox').check();
    await sleep(500);
    searchResults = await page.locator("div[aria-label='Hakutulokset'] > a").allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectA.projectName)) &&
        searchResults.some((result) => result.includes(projectB.projectName)) &&
        searchResults.every((result) => !result.includes(projectC.projectName))
    ).toBe(true);

    await page.getByRole('option', { name: 'Aloittamatta' }).getByRole('checkbox').uncheck();
    await page.getByRole('option', { name: 'Käynnissä' }).getByRole('checkbox').check();
    await sleep(500);

    searchResults = await page.locator("div[aria-label='Hakutulokset'] > a").allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectC.projectName)) &&
        searchResults.every((result) => !result.includes(projectA.projectName)) &&
        searchResults.every((result) => !result.includes(projectB.projectName))
    ).toBe(true);

    // Clean up the test case
    await deleteProject(page, projectA.id);
    await deleteProject(page, projectB.id);
    await deleteProject(page, projectC.id);
  });
});
