import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

test.describe('Project endpoints', () => {
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('getAll', async () => {
    const result = await client.project.getAll.query({ asdf: 'qwe' });
    expect(result).toBeDefined();
  });
});
