import { expect } from '@playwright/test';

import { test } from '../utils/fixtures.js';

test.describe('Work table with customized maximum row count', () => {
  test('should render without errors', async ({ testSession }) => {
    await testSession.page.getByRole('tab', { name: 'Ohjelmointi' }).click();
    const errorHeader = testSession.page.getByText('Unexpected Application Error!');
    const header = testSession.page.getByTestId('worktable-title');

    await expect(errorHeader).not.toBeVisible();
    await expect(header).toBeVisible();
  });
});
