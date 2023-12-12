import { expect, Page, test } from '@playwright/test';
import type { InvestmentProject } from '@shared/schema/project/investment';
import { sleep } from '@shared/utils';
import { fillDatePickerValue, getDatePickerValue } from '@utils/date-picker';
import { login } from '@utils/page';
import { ADMIN_USER, DEV_USER, UserSessionObject } from '@utils/users';

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
    projectId,
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

async function createProject(
  page: Page,
  project: InvestmentProject,
  client: UserSessionObject['client']
) {
  // Go to the new project page
  await page.getByRole('button', { name: 'Luo uusi hanke' }).click();
  await page.getByRole('menuitem', { name: 'Uusi investointihanke' }).click();
  await expect(page).toHaveURL('https://localhost:1443/investointihanke/luo');

  // Fill in the project data and save the project
  await page.locator('input[name="projectName"]').fill(project.projectName);
  await page.locator('textarea[name="description"]').fill(project.description);

  await fillDatePickerValue(page.locator('input[name="startDate"]'), project.startDate);
  await fillDatePickerValue(page.locator('input[name="endDate"]'), project.endDate);

  const lifecycleText = lifecycleStateToText[project.lifecycleState];
  if (lifecycleText) {
    await page.getByLabel('Elinkaaren tila').click();
    await page.getByRole('option', { name: lifecycleText }).click();
  }

  await page.getByLabel('Lautakunta').click();
  await page.getByRole('option', { name: 'Yhdyskuntalautakunta' }).click();

  await page.getByRole('button', { name: 'Lisää hanke' }).click();

  // URL should include the newly created project ID, parse it from the URL
  await expect(page).toHaveURL(/https:\/\/localhost:1443\/investointihanke\/[0-9a-f-]+/);
  const projectId = page.url().split('/').at(-1);

  await client.project.updateGeometry.mutate(geometryPayload(projectId, keskustoriGeom));

  // Go back to the front page
  await page.getByRole('link', { name: 'Hankkeet' }).click();
  await expect(page).toHaveURL('https://localhost:1443/hankkeet');

  // Return the created project with ID
  return {
    ...project,
    projectId: projectId,
  } as InvestmentProject;
}

async function deleteProject(page: Page, projectId: string) {
  // Go to the project page
  await page.goto(`https://localhost:1443/investointihanke/${projectId}`);

  // Delete the project
  await page.getByRole('button', { name: 'Poista hanke' }).click();
  await page.getByRole('button', { name: 'Poista' }).click();
  await expect(page).toHaveURL('https://localhost:1443/hankkeet');

  // Expect the project page to not exist anymore
  await page.goto(`https://localhost:1443/investointihanke/${projectId}`);
  await expect(page.getByText('Hanketta ei löytynyt')).toBeVisible();
  await page.goto('https://localhost:1443/hankkeet');
}

test.describe('Projects', () => {
  let adminSession: UserSessionObject;
  let devSession: UserSessionObject;

  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    adminSession.client.userPermissions.setPermissions.mutate([
      {
        userId: DEV_USER,
        permissions: ['investmentProject.write'],
      },
    ]);
    devSession = await login(browser, DEV_USER);
  });

  test('Create a project', async () => {
    let project: InvestmentProject = {
      projectName: `Testihanke ${Date.now()}`,
      description: 'Testikuvaus',
      startDate: '1.12.2022',
      endDate: '28.2.2023',
    };

    project = { ...project, ...(await createProject(devSession.page, project, devSession.client)) };

    // Click on the new project button to go back to the project page
    await devSession.page.locator(`text=${project.projectName}`).click();
    await expect(devSession.page).toHaveURL(
      `https://localhost:1443/investointihanke/${project.projectId}`
    );

    // Check that all fields still have the same values
    await expect(devSession.page.locator('input[name="projectName"]')).toHaveValue(
      project.projectName
    );
    await expect(devSession.page.locator('textarea[name="description"]')).toHaveValue(
      project.description
    );

    expect(await getDatePickerValue(devSession.page.locator('input[name="startDate"]'))).toBe(
      project.startDate
    );
    expect(await getDatePickerValue(devSession.page.locator('input[name="endDate"]'))).toBe(
      project.endDate
    );

    await deleteProject(devSession.page, project.projectId);
  });

  test('Delete project', async () => {
    const project = await createProject(
      devSession.page,
      {
        projectName: 'Tuhottava hanke',
        description: 'Testikuvaus',
        startDate: '1.12.2022',
        // TODO 31st days don't work via keyboard input: https://github.com/mui/mui-x/issues/8485
        endDate: '30.12.2022',
      },
      devSession.client
    );

    await deleteProject(devSession.page, project.projectId);
  });

  test('Project search', async () => {
    const projectA = await createProject(
      devSession.page,
      {
        projectName: `Hakutesti ${Date.now()}`,
        description: 'Myös kuvauksen teksti otetaan haussa huomioon',
        startDate: '1.12.2022',
        endDate: '28.2.2023',
        lifecycleState: '01',
      },
      devSession.client
    );

    const projectB = await createProject(
      devSession.page,
      {
        projectName: `Toinen hakutesti ${Date.now()}`,
        description: 'Tässä on toisen testihankkeen kuvaus',
        startDate: '1.1.2001',
        endDate: '31.12.2099',
        lifecycleState: '01',
      },
      devSession.client
    );

    const projectC = await createProject(
      devSession.page,
      {
        projectName: `Kolmas hakutesti ${Date.now()}`,
        description: 'Tässä on kolmannen testihankkeen kuvaus',
        startDate: '1.1.2001',
        endDate: '31.12.2099',
        lifecycleState: '02',
      },
      devSession.client
    );

    // Search for projectA - projectB should not be in results
    await devSession.page.fill('label:has-text("Haku")', 'huomio');
    // Delay required because of debouncing
    await sleep(1000);

    let searchResults = await devSession.page
      .locator("div[aria-label='Hakutulokset'] > a")
      .allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectA.projectName)) &&
        searchResults.every((result) => !result.includes(projectB.projectName))
    ).toBe(true);

    // Search for projectB - projectA should not be in results
    await devSession.page.fill('label:has-text("Haku")', 'kuvaus');
    await sleep(1000);
    searchResults = await devSession.page
      .locator("div[aria-label='Hakutulokset'] > a")
      .allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectB.projectName)) &&
        searchResults.every((result) => !result.includes(projectA.projectName))
    ).toBe(true);

    // Search for both projects
    await devSession.page.fill('label:has-text("Haku")', 'hakutesti');
    await sleep(1000);
    searchResults = await devSession.page
      .locator("div[aria-label='Hakutulokset'] > a")
      .allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectB.projectName)) &&
        searchResults.some((result) => result.includes(projectA.projectName))
    ).toBe(true);

    // Search for other projects (only prefixes should be matched - no other substrings!)
    await devSession.page.fill('label:has-text("Haku")', 'akutesti');
    await sleep(1000);
    searchResults = await devSession.page
      .locator("div[aria-label='Hakutulokset'] > a")
      .allTextContents();
    expect(
      searchResults.every((result) => !result.includes(projectB.projectName)) &&
        searchResults.every((result) => !result.includes(projectA.projectName))
    ).toBe(true);

    // search with elinkaaren tila filter
    await devSession.page.fill('label:has-text("Haku")', '');
    await devSession.page.getByLabel('Elinkaaren tila').press('ArrowDown');
    await devSession.page
      .getByRole('option', { name: 'Aloittamatta' })
      .getByRole('checkbox')
      .check();
    await sleep(500);
    searchResults = await devSession.page
      .locator("div[aria-label='Hakutulokset'] > a")
      .allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectA.projectName)) &&
        searchResults.some((result) => result.includes(projectB.projectName)) &&
        searchResults.every((result) => !result.includes(projectC.projectName))
    ).toBe(true);

    await devSession.page
      .getByRole('option', { name: 'Aloittamatta' })
      .getByRole('checkbox')
      .uncheck();
    await devSession.page.getByRole('option', { name: 'Käynnissä' }).getByRole('checkbox').check();
    await sleep(500);

    searchResults = await devSession.page
      .locator("div[aria-label='Hakutulokset'] > a")
      .allTextContents();
    expect(
      searchResults.some((result) => result.includes(projectC.projectName)) &&
        searchResults.every((result) => !result.includes(projectA.projectName)) &&
        searchResults.every((result) => !result.includes(projectB.projectName))
    ).toBe(true);

    // Clean up the test case
    await deleteProject(devSession.page, projectA.projectId);
    await deleteProject(devSession.page, projectB.projectId);
    await deleteProject(devSession.page, projectC.projectId);
  });
});
