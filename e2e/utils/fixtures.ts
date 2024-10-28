import { Browser, Page, test as base } from '@playwright/test';
import { getNewSession, login } from '@utils/page.js';
import { ADMIN_USER, DEV_USER, TEST_USER, clearUserPermissions } from '@utils/users.js';

import { User } from '@shared/schema/user.js';
import { User as AuthUser } from '@shared/schema/userPermissions.js';

interface SessionFixtures {
  devSession: Session;
  testSession: Session;
}

interface WorkerFixtures {
  refreshCachedSession: (session: Session) => Promise<void>;
  refreshAllSessions: () => Promise<void>;
  adminSession: Session;
  workerDevSession: Session;
  resetCachedSessions: () => Promise<void>;
  modifyPermissions: (userId: User['id'], permissions: AuthUser['permissions']) => Promise<any>;
}

class Session {
  private _page: Page;
  private _user: User;
  private _type: 'default' | 'worker';
  private _client: Awaited<ReturnType<typeof login>>['client'];

  constructor(
    session: Awaited<ReturnType<typeof login>>,
    user: User,
    type: 'default' | 'worker' = 'default',
  ) {
    this._page = session.page;
    this._user = user;
    this._type = type;
    this._client = session.client;
  }

  get client() {
    return this._client;
  }

  set client(newClient: Awaited<ReturnType<typeof login>>['client']) {
    this._client = newClient;
  }

  get page() {
    return this._page;
  }

  set page(newPage: Page) {
    this._page = newPage;
  }

  get user() {
    return this._user;
  }

  set user(newUser: User) {
    this._user = newUser;
  }

  get type() {
    return this._type;
  }

  async refresh(browser: Browser) {
    const { page, client } = await getNewSession(browser, this.user.id, this.page);
    this.page = page;
    this.client = client;
  }
}

const sessionCache: Record<string, Session> = {
  [DEV_USER]: null,
  [TEST_USER]: null,
};

const workerSessionCache: Record<string, Session> = {
  [ADMIN_USER]: null,
  [DEV_USER]: null,
  [TEST_USER]: null,
};

export const test = base.extend<SessionFixtures, WorkerFixtures>({
  adminSession: [
    async ({ browser }, use) => {
      if (!workerSessionCache[ADMIN_USER]) {
        const loginSession = await login(browser, ADMIN_USER);
        const user = await loginSession.client.user.self.query();
        workerSessionCache[ADMIN_USER] = new Session(loginSession, user, 'worker');
      }

      await use(workerSessionCache[ADMIN_USER]);
    },
    { scope: 'worker' },
  ],
  resetCachedSessions: [
    async ({ adminSession, refreshAllSessions }, use) => {
      await use(async () => {
        await clearUserPermissions(
          adminSession.client,
          Object.keys(sessionCache).filter((key) => Boolean(sessionCache[key])),
        );
        await refreshAllSessions();
      });
    },
    { scope: 'worker' },
  ],
  refreshCachedSession: [
    async ({ browser }, use) => {
      await use(async (session) => {
        switch (session?.type) {
          case 'worker':
            return workerSessionCache[session.user.id]?.refresh(browser);
          case 'default':
            return sessionCache[session.user.id]?.refresh(browser);
          default:
            return;
        }
      });
    },
    { scope: 'worker' },
  ],
  refreshAllSessions: [
    async ({ browser }, use) => {
      await use(async () => {
        await Promise.all(
          Object.values(sessionCache)
            .concat(Object.values(workerSessionCache))
            .filter(Boolean)
            .map(async (session) => {
              await session?.refresh(browser);
            }),
        );
      });
    },
    { scope: 'worker' },
  ],
  modifyPermissions: [
    async ({ adminSession, refreshCachedSession }, use) => {
      await use(async (userId, permissions) => {
        const result = await adminSession.client.userPermissions.setPermissions.mutate([
          {
            userId,
            permissions,
          },
        ]);
        await refreshCachedSession(sessionCache[userId]);
        await refreshCachedSession(workerSessionCache[userId]);
        return result;
      });
    },
    { scope: 'worker' },
  ],
  workerDevSession: [
    async ({ browser, modifyPermissions }, use) => {
      if (!workerSessionCache[DEV_USER]) {
        const loginSession = await login(browser, DEV_USER);
        const user = await loginSession.client.user.self.query();
        workerSessionCache[DEV_USER] = new Session(loginSession, user, 'worker');
      }

      await use(workerSessionCache[DEV_USER]);

      await modifyPermissions(DEV_USER, []);
    },
    { scope: 'worker' },
  ],
  devSession: async ({ browser, modifyPermissions }, use) => {
    if (!sessionCache[DEV_USER]) {
      const loginSession = await login(browser, DEV_USER);
      const user = await loginSession.client.user.self.query();
      sessionCache[DEV_USER] = new Session(loginSession, user);
    }

    await use(sessionCache[DEV_USER]);

    await modifyPermissions(DEV_USER, []);
  },

  testSession: async ({ browser, modifyPermissions }, use) => {
    if (!sessionCache[TEST_USER]) {
      const loginSession = await login(browser, TEST_USER);
      const user = await loginSession.client.user.self.query();
      sessionCache[TEST_USER] = new Session(loginSession, user);
    }

    await use(sessionCache[TEST_USER]);

    await modifyPermissions(TEST_USER, []);
  },
});
