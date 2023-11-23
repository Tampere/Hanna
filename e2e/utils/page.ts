import { Page } from 'playwright';
import { setCookies } from './trpc';

export async function login(page: Page, username: string = 'dev@localhost') {
  // Set up a listener to fail any test that has HTTP 500 errors.
  // This should happen e.g. in watch mode when server code changes, and tests are run before the server has restarted.
  page.on('response', (response) => {
    if (response.status() >= 500) {
      console.error(
        `Received error ${response.status()}. If the servers were not ready, re-run the tests by writing "rs" + <enter>.`
      );
      process.exit(1);
    }
  });

  await page.goto('https://localhost:1443/');
  await page.getByPlaceholder('Enter any login').fill(username);
  await page.getByPlaceholder('and password').fill('foobar');
  await page.getByRole('button', { name: 'Sign-in' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  setCookies(await page.context().cookies());
}

export async function logout(page: Page) {
  await page.goto('https://localhost:1443/logout');
  await page.context().clearCookies();
  setCookies([]);
}

export async function changeUser(page: Page, username: string) {
  await logout(page);
  await login(page, username);
}
