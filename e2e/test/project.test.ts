import { test, expect } from '@playwright/test';
import { login } from '@utils/page';

test.describe('Projects', () => {
  test('Create a project', async ({ page }) => {
    const project = {
      name: `Testihanke ${Date.now()}`,
      description: 'Testikuvaus',
      startDate: '01.12.2022',
      endDate: '28.02.2023',
    };

    await login(page);

    // Go to the new project page
    await page.getByRole('link', { name: 'Luo uusi hanke' }).click();
    await expect(page).toHaveURL('https://localhost:1443/hanke/luo');

    // Fill in the project data and save the project
    await page.locator('input[name="projectName"]').fill(project.name);
    await page.locator('textarea[name="description"]').fill(project.description);
    await page.locator('input[name="startDate"]').fill(project.startDate);
    await page.locator('input[name="endDate"]').fill(project.endDate);

    await page.getByRole('button', { name: 'Lisää hanke' }).click();

    // URL should include the newly created project ID, parse it from the URL
    await expect(page).toHaveURL(/https:\/\/localhost:1443\/hanke\/[0-9a-f-]+/);
    const projectId = page.url().split('/').at(-1);

    // Go back to the front page
    await page.getByRole('link', { name: 'Hankkeet' }).click();
    await expect(page).toHaveURL('https://localhost:1443/hankkeet');

    // Click on the new project button to go back to the project page
    await page.locator(`text=${project.name}`).click();
    await expect(page).toHaveURL(`https://localhost:1443/hanke/${projectId}`);

    // Check that all fields still have the same values
    await expect(page.locator('input[name="projectName"]')).toHaveValue(project.name);
    await expect(page.locator('textarea[name="description"]')).toHaveValue(project.description);
    await expect(page.locator('input[name="startDate"]')).toHaveValue(project.startDate);
    await expect(page.locator('input[name="endDate"]')).toHaveValue(project.endDate);
  });
});
