import { atom } from 'jotai';

interface Auth {
  isLoggedIn: boolean;
  username: string | null;
}

export const authAtom = atom<Auth>({
  isLoggedIn: false,
  username: null,
});

export const loginAtom = atom<Auth, void>(
  (get) => get(authAtom),
  async (_get, set) => {
    const loginInfo = { username: 'foo' };
    set(authAtom, { isLoggedIn: true, username: loginInfo.username });
  }
);

export const logoutAtom = atom<Auth, void>(
  (get) => get(authAtom),
  async (_get, set) => {
    set(authAtom, { isLoggedIn: false, username: null });
  }
);
