import { expect, test } from '@playwright/test';
import { login } from '@utils/page';

test.describe('Work table with customized maximum row count', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should render without errors', async ({ page }) => {
    await page.getByRole('tab', { name: 'Investointiohjelmointi' }).click();
    const errorHeader = page.getByText('Unexpected Application Error!');
    const header = page.getByTestId('worktable-title');

    await expect(errorHeader).not.toBeVisible();
    await expect(header).toBeVisible();
  });
});
