import { createTRPCProxyClient } from '@trpc/client';
import { httpLink } from '@trpc/client/links/httpLink';
import { Agent } from 'https';
import nodeFetch, { RequestInit } from 'node-fetch';
import { setDefaultResultOrder } from 'node:dns';
import { Cookie, Page } from 'playwright';
import superjson from 'superjson';

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
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpLink({
        url: 'https://localhost:1443/trpc',
        fetch(url, options) {
          return nodeFetch(url.toString(), {
            ...options,
            agent,
            headers: {
              ...options.headers,
              cookie: getCookieHeaderValue(cookies),
            },
          } as RequestInit);
        },
      }),
    ],
    transformer: superjson,
  });
}
