import { atom } from 'jotai';

import { User } from '@shared/schema/user';

export const authAtom = atom<User | null>(null);

async function getUser() {
  const resp = await fetch('/api/v1/auth/user');
  if (resp.status === 401) {
    window.location.href = '/api/v1/auth/login';
  }
  return (await resp.json()) as User;
}

export const getUserAtom = atom<Promise<User>>(async () => getUser());
