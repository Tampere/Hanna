import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { client } from '@utils/trpc';

import type { Code } from '@shared/schema/code';

test.describe('Code endpoints', () => {
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('get codes for a list', async () => {
    const codeListId: Code['codeListId'] = 'Hanketyyppi';

    const codes = await client.code.get.query({ codeListId });
    expect(Array.isArray(codes)).toBe(true);
    expect(codes.every((code) => code.codeListId === codeListId));
  });
});
