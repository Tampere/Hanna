import { atom } from 'jotai';
import { atomWithRefresh } from 'jotai/utils';

import { User } from '@shared/schema/user';

export const sessionExpiredAtom = atom<boolean>(false);

async function getUser() {
  const resp = await fetch('/api/v1/auth/user');
  if (resp.status === 401) {
    // Pass the current location as the redirect parameter
    window.location.href = `/api/v1/auth/login?redirect=${encodeURIComponent(
      window.location.pathname,
    )}`;
  }
  return (await resp.json()) as User;
}

export const asyncUserAtom = atomWithRefresh<Promise<User>>(async () => getUser());
