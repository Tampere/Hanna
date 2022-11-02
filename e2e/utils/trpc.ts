import { createTRPCProxyClient } from '@trpc/client';
import { httpLink } from '@trpc/client/links/httpLink';
import superjson from 'superjson';
import type { AppRouter } from '../../backend/src/router';
import { Agent } from 'https';
import nodeFetch from 'node-fetch';
import { setDefaultResultOrder } from 'node:dns';

// In Node version >= 17 localhost is resolved with IPv6 rather than IPv4 - revert this back to normal to make Caddy work properly
setDefaultResultOrder('ipv4first');

interface Cookie {
  name: string;
  value: string;
}

let cookieStore: Cookie[];

// Use node-fetch to ignore SSL errors
const agent = new Agent({
  rejectUnauthorized: false,
});

export function setCookies(cookies: Cookie[]) {
  cookieStore = [...cookies];
}

function getCookieHeaderValue() {
  return cookieStore.map(({ name, value }) => `${name}=${value}`).join('; ');
}

export const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: 'https://localhost:1443/trpc',
      fetch(url, options) {
        return nodeFetch(url, {
          ...options,
          agent,
          headers: {
            ...options.headers,
            cookie: getCookieHeaderValue(),
          },
        });
      },
    }),
  ],
  transformer: superjson,
});
