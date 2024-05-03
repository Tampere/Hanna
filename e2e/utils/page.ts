import { Browser, Page } from 'playwright';
import { expect } from 'playwright/test';

import { createTRPCClient } from './trpc';

export async function login(browser: Browser, username: string) {
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('response', (response) => {
    if (response.status() >= 500) {
      console.error(
        `Received error ${response.status()}. If the servers were not ready, re-run the tests by writing "rs" + <enter>.`,
      );
      process.exit(1);
    }
  });

  await page.goto('https://localhost:1443/');
  await page.getByPlaceholder('Enter any login').fill(username);
  await page.getByPlaceholder('and password').fill('foobar');
  await page.getByRole('button', { name: 'Sign-in' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  const client = await createTRPCClient(page);
  return { client, page };
}

export async function logout(page: Page) {
  await page.goto('https://localhost:1443/');
  await page.locator('[data-test-id="profileMenuButton"]').click();
  await page.getByTestId('logoutButton').click();
  await expect(page.locator('h1')).toContainText('Sign-out Success');
}

export async function refreshSession(browser: Browser, username: string, page: Page) {
  await logout(page);
  return login(browser, username);
}
