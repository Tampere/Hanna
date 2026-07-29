import { createTRPCProxyClient } from '@trpc/client';
import { httpLink } from '@trpc/client/links/httpLink';
import { Agent } from 'https';
import nodeFetch from 'node-fetch';
import { setDefaultResultOrder } from 'node:dns';
import superjson from 'superjson';

import type { RequestInit } from 'node-fetch';

import type { Cookie, Page } from 'playwright';
import type { AppRouter } from '../../backend/src/router/index.js';

// In Node version >= 17 localhost is resolved with IPv6 rather than IPv4 - revert this back to normal to make Caddy work properly
setDefaultResultOrder('ipv4first');

function getCookieHeaderValue(cookies: Cookie[]) {
  return cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
}

export async function createTRPCClient(page: Page) {
  const agent = new Agent({
    rejectUnauthorized: false,
  });
  const cookies = await page.context().cookies();
  const cookieHeader = getCookieHeaderValue(cookies);

  const userResponse = await nodeFetch('https://localhost:1443/api/v1/auth/user', {
    agent,
    headers: { cookie: cookieHeader },
  } as RequestInit);
  const { csrfToken } = (await userResponse.json()) as { csrfToken?: string };
  if (!csrfToken) {
    throw new Error('Failed to fetch CSRF token - session was not established after login');
  }

  return createTRPCProxyClient<AppRouter>({
    links: [
      httpLink({
        url: 'https://localhost:1443/trpc',
        fetch(url, options) {
          return nodeFetch(url.toString(), {
            ...options,
            agent,
            headers: {
              ...(options?.headers),
              cookie: cookieHeader,
              'csrf-token': csrfToken,
            },
          } as RequestInit);
        },
      }),
    ],
    transformer: superjson,
  });
}
