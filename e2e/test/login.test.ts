import { expect, test } from '@playwright/test';
import { login } from '@utils/page.js';
import { DEV_USER } from '@utils/users.js';

test('Login', async ({ browser }) => {
  const { page } = await login(browser, DEV_USER);

  await expect(page).toHaveURL('https://localhost:1443/');
});
