import { atom } from 'jotai';
import { atomWithRefresh } from 'jotai/utils';

import { User } from '@shared/schema/user';

export const sessionExpiredAtom = atom<boolean>(false);

type UserResponse = User & { csrfToken: string };

// Kept outside of jotai state since the trpc client's fetch override needs to read/write it
// synchronously on every request, without subscribing to React state changes.
let csrfToken: string | undefined;

export function getCsrfToken() {
  return csrfToken;
}

async function getUser() {
  const resp = await fetch('/api/v1/auth/user');
  if (resp.status === 401) {
    // Pass the current location as the redirect parameter
    window.location.href = `/api/v1/auth/login?redirect=${encodeURIComponent(
      window.location.pathname,
    )}`;
  }
  const data = (await resp.json()) as UserResponse;
  csrfToken = data.csrfToken;
  return data;
}

// Re-fetches the csrf token when a mutation reports it as stale/missing (e.g. after the
// session was renewed or the previous token's secret rotated).
export async function refreshCsrfToken() {
  await getUser();
  return csrfToken;
}

export const asyncUserAtom = atomWithRefresh<Promise<User>>(async () => getUser());
