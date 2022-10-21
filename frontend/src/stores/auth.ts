import { atom } from 'jotai';

interface Auth {
  userId: string | null;
}

export const authAtom = atom<Auth>({ userId: null });

async function getUser() {
  const resp = await fetch('/api/v1/auth/user');
  if (resp.status === 401) {
    window.location.href = '/api/v1/auth/login';
  }
  const userData = await resp.json();
  return { userId: userData.id };
}

export const getUserAtom = atom<Promise<Auth>>(async () => getUser());
