import { expect, test } from '@playwright/test';
import { login } from '@utils/page.js';
import { TEST_USER, UserSessionObject } from '@utils/users.js';

test.describe('Work table with customized maximum row count', () => {
  let userSession: UserSessionObject;
  test.beforeAll(async ({ browser }) => {
    userSession = await login(browser, TEST_USER);
  });

  test('should render without errors', async () => {
    await userSession.page.getByRole('tab', { name: 'Investointiohjelmointi' }).click();
    const errorHeader = userSession.page.getByText('Unexpected Application Error!');
    const header = userSession.page.getByTestId('worktable-title');

    await expect(errorHeader).not.toBeVisible();
    await expect(header).toBeVisible();
  });
});
