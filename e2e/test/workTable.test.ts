import { expect } from '@playwright/test';
import { login } from '@utils/page.js';
import { TEST_USER, UserSessionObject } from '@utils/users.js';

import { test } from '../utils/fixtures.js';

test.describe('Work table with customized maximum row count', () => {
  test('should render without errors', async ({ testSession }) => {
    await testSession.session.page.getByRole('tab', { name: 'Investointiohjelmointi' }).click();
    const errorHeader = testSession.session.page.getByText('Unexpected Application Error!');
    const header = testSession.session.page.getByTestId('worktable-title');

    await expect(errorHeader).not.toBeVisible();
    await expect(header).toBeVisible();
  });
});
