import type { Page } from 'playwright';
import { expect } from '@playwright/test';
import { fillDatePickerValue, getDatePickerValue } from '@utils/date-picker.js';
import { clearData } from '@utils/db.js';
import { DEV_USER } from '@utils/users.js';
import { test } from '@utils/fixtures.js';

import type { UserSessionObject } from '@utils/users.js';

type ProjectInput = {
  projectName: string;
  description: string;
  publicDescription: string;
  startDate: string;
  endDate: string;
  lifecycleState?: string;
};

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
  project: ProjectInput,
  client: UserSessionObject['client'],
) {
  // Go to the new project page
  await page.getByRole('button', { name: 'Luo uusi hanke' }).click();
  await page.getByRole('menuitem', { name: 'Uusi investointihanke' }).click();
  await expect(page).toHaveURL('https://localhost:1443/investointihanke/luo');

  // Fill in the project data and save the project
  await page.locator('input[name="projectName"]').fill(project.projectName);
  await page.locator('textarea[name="description"]').fill(project.description);
  await page.locator('textarea[name="publicDescription"]').fill(project.publicDescription);

  await fillDatePickerValue(page.locator('input[name="startDate"]'), project.startDate);
  await fillDatePickerValue(page.locator('input[name="endDate"]'), project.endDate);

  const lifecycleText = lifecycleStateToText[project.lifecycleState as keyof typeof lifecycleStateToText];
  if (lifecycleText) {
    await page.getByLabel('Elinkaaren tila *', { exact: true }).click();
    await page.getByRole('option', { name: lifecycleText }).click();
  }

  await page.getByLabel('Lautakunta *', { exact: true }).click();
  await page.getByRole('option', { name: 'Yhdyskuntalautakunta' }).getByRole('checkbox').check();

  await page.getByRole('button', { name: 'Tallenna' }).click();

  // URL should include the newly created project ID, parse it from the URL
  await expect(page).toHaveURL(/https:\/\/localhost:1443\/investointihanke\/[0-9a-f-]+/);
  const projectId = page.url().split('/').at(-1) as string;

  await client.project.updateGeometry.mutate(geometryPayload(projectId, keskustoriGeom));

  // Go back to the front page
  await page.getByRole('banner').getByRole('tab', { name: 'Kartta' }).click();
  await expect(page).toHaveURL('https://localhost:1443/kartta/hankkeet');

  // Return the created project with ID
  return { ...project, projectId };
}

async function deleteProject(page: Page, projectId: string) {
  // Go to the project page
  await page.goto(`https://localhost:1443/investointihanke/${projectId}`);

  // Delete the project
  await page.getByRole('button', { name: 'Muokkaa hanketta' }).click();
  await page.getByRole('button', { name: 'Poista hanke' }).click();
  await page.getByRole('button', { name: 'Poista' }).click();
  await expect(page).toHaveURL('https://localhost:1443/kartta/hankkeet');

  // Expect the project page to not exist anymore
  await page.goto(`https://localhost:1443/investointihanke/${projectId}`);
  await expect(page.getByText('Hanketta ei löytynyt')).toBeVisible();
  await page.goto('https://localhost:1443/kartta/hankkeet');
}

test.describe('Projects', () => {
  test.beforeAll(async ({ modifyPermissions }) => {
    await modifyPermissions(DEV_USER, ['investmentProject.write']);
  });

  test.afterAll(async ({ resetCachedSessions }) => {
    await resetCachedSessions();
    await clearData();
  });

  test('Create a project', async ({ workerDevSession }) => {
    const projectInput: ProjectInput = {
      projectName: `Testihanke ${Date.now()}`,
      description: 'Testikuvaus',
      publicDescription: 'Julkinen testikuvaus',
      startDate: '1.12.2022',
      endDate: '28.2.2023',
    };

    const project = {
      ...projectInput,
      ...(await createProject(workerDevSession.page, projectInput, workerDevSession.client)),
    };

    // Click on the new project button to go back to the project page
    await workerDevSession.page.locator(`text=${project.projectName}`).click();
    await expect(workerDevSession.page).toHaveURL(
      `https://localhost:1443/investointihanke/${project.projectId}`,
    );

    // Check that all fields still have the same values
    await expect(workerDevSession.page.locator('input[name="projectName"]')).toHaveValue(
      project.projectName,
    );
    await expect(workerDevSession.page.locator('textarea[name="description"]')).toHaveValue(
      project.description,
    );
    await expect(workerDevSession.page.locator('textarea[name="publicDescription"]')).toHaveValue(
      project.publicDescription,
    );

    expect(await getDatePickerValue(workerDevSession.page.locator('input[name="startDate"]'))).toBe(
      project.startDate,
    );
    expect(await getDatePickerValue(workerDevSession.page.locator('input[name="endDate"]'))).toBe(
      project.endDate,
    );

    await deleteProject(workerDevSession.page, project.projectId);
  });

  test('Delete project', async ({ workerDevSession }) => {
    const project = await createProject(
      workerDevSession.page,
      {
        projectName: 'Tuhottava hanke',
        description: 'Testikuvaus',
        publicDescription: 'Julkinen testikuvaus',
        startDate: '1.12.2022',
        // TODO 31st days don't work via keyboard input: https://github.com/mui/mui-x/issues/8485
        endDate: '30.12.2022',
      },
      workerDevSession.client,
    );

    await deleteProject(workerDevSession.page, project.projectId);
  });

  test('Project search', async ({ workerDevSession }) => {
    const projectA = await createProject(
      workerDevSession.page,
      {
        projectName: `Hakutesti ${Date.now()}`,
        description: 'Myös kuvauksen teksti otetaan haussa huomioon',
        publicDescription: 'Julkinen kuvaus A',
        startDate: '1.12.2022',
        endDate: '28.2.2023',
        lifecycleState: '01',
      },
      workerDevSession.client,
    );

    const projectB = await createProject(
      workerDevSession.page,
      {
        projectName: `Toinen hakutesti ${Date.now()}`,
        description: 'Tässä on toisen testihankkeen kuvaus',
        publicDescription: 'Julkinen kuvaus B',
        startDate: '1.1.2002',
        endDate: '31.12.2099',
        lifecycleState: '01',
      },
      workerDevSession.client,
    );

    const projectC = await createProject(
      workerDevSession.page,
      {
        projectName: `Kolmas hakutesti ${Date.now()}`,
        description: 'Tässä on kolmannen testihankkeen kuvaus',
        publicDescription: 'Julkinen kuvaus C',
        startDate: '1.1.2001',
        endDate: '31.12.2099',
        lifecycleState: '02',
      },
      workerDevSession.client,
    );

    // Search for projectA - projectB should not be in results
    await workerDevSession.page.fill('label:has-text("Haku")', 'huomio');
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).toContainText(projectA.projectName);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).not.toContainText(projectB.projectName);

    // Search for projectB - projectA should not be in results
    await workerDevSession.page.fill('label:has-text("Haku")', 'toisen');
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).toContainText(projectB.projectName);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).not.toContainText(projectA.projectName);

    // Search for all projects
    await workerDevSession.page.fill('label:has-text("Haku")', 'hakutesti');
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään 3 hanketta:'] > a"),
    ).toContainText([projectA.projectName, projectB.projectName, projectC.projectName]);

    // Search for projectC
    await workerDevSession.page.fill('label:has-text("Haku")', 'kolmas');
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).toContainText(projectC.projectName);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).not.toContainText(projectA.projectName);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).not.toContainText(projectB.projectName);

    // Search for unexisting project
    await workerDevSession.page.fill('label:has-text("Haku")', 'ei löydy');
    await expect(workerDevSession.page.locator('div[aria-label="Ei hakutuloksia."]')).toBeVisible();

    // search with elinkaaren tila filter
    await workerDevSession.page.fill('label:has-text("Haku")', '');
    await workerDevSession.page.getByLabel('Elinkaaren tila').press('ArrowDown');
    await workerDevSession.page
      .getByRole('option', { name: 'Aloittamatta' })
      .getByRole('checkbox')
      .check();

    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään 2 hanketta:'] > a"),
    ).toContainText([projectA.projectName, projectB.projectName]);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään 2 hanketta:'] > a"),
    ).not.toContainText([projectC.projectName]);

    await workerDevSession.page
      .getByRole('option', { name: 'Aloittamatta' })
      .getByRole('checkbox')
      .uncheck();
    await workerDevSession.page
      .getByRole('option', { name: 'Käynnissä' })
      .getByRole('checkbox')
      .check();

    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).toContainText(projectC.projectName);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).not.toContainText(projectA.projectName);
    await expect(
      workerDevSession.page.locator("div[aria-label='Näytetään yksi hanke:'] > a"),
    ).not.toContainText(projectB.projectName);

    // Clean up the test case
    await deleteProject(workerDevSession.page, projectA.projectId);
    await deleteProject(workerDevSession.page, projectB.projectId);
    await deleteProject(workerDevSession.page, projectC.projectId);
  });
});
