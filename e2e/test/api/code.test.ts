import test, { expect } from '@playwright/test';
import { login } from '@utils/page';
import { ADMIN_USER, UserSessionObject } from '@utils/users';

import type { Code } from '@shared/schema/code';

test.describe('Code endpoints', () => {
  let adminSession: UserSessionObject;
  // Login to retrieve the cookies for authorizing tRPC queries
  test.beforeEach(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
  });

  test('get codes for a list', async () => {
    const codeListId: Code['id']['codeListId'] = 'HankeTyyppi';

    const codes = await adminSession.client.code.get.query({ codeListId });
    expect(Array.isArray(codes)).toBe(true);
    expect(codes.every((code) => code.id.codeListId === codeListId));
  });
});
