import { expect, test } from '@playwright/test';
import { login } from '@utils/page';

test('Login', async ({ page }) => {
  await login(page);

  await expect(page).toHaveURL('https://localhost:1443/');
});
