import { expect } from '@playwright/test';
import { test } from '@utils/fixtures.js';

import type { Code } from '@shared/schema/code.js';

test.describe('Code endpoints', () => {
  test('get codes for a list', async ({ adminSession }) => {
    const codeListId: Code['id']['codeListId'] = 'HankeTyyppi';

    const codes = await adminSession.client.code.get.query({ codeListId });
    expect(Array.isArray(codes)).toBe(true);
    expect(codes.every((code) => code.id.codeListId === codeListId));
  });
});
