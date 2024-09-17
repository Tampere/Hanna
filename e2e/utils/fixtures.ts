import { test as base, expect, mergeTests } from '@playwright/test';
import { login, refreshSession } from '@utils/page.js';
import { ADMIN_USER, DEV_USER, TEST_USER, TestUserId, clearUserPermissions } from '@utils/users.js';

import { User } from '@shared/schema/user.js';
import { User as AuthUser } from '@shared/schema/userPermissions.js';

interface SessionFixtures {
  adminSession: Session;
  devSession: Session;
  testSession: Session;
  refreshSession: typeof refreshSession;
  modifyPermissions: (userId: string, permissions: AuthUser['permissions']) => Promise<void>;
}

class Session {
  private sessionObject: Awaited<ReturnType<typeof login>>;
  private sessionUser: User;

  constructor(session: Awaited<ReturnType<typeof login>>, user: User) {
    this.sessionObject = session;
    this.sessionUser = user;
  }

  get session() {
    return this.sessionObject;
  }

  set session(newSession: typeof this.sessionObject) {
    this.sessionObject = newSession;
  }

  get user() {
    return this.sessionUser;
  }

  set user(newUser: User) {
    this.sessionUser = newUser;
  }
}

export const test = base.extend<SessionFixtures>({
  adminSession: async ({ browser }, use) => {
    const loginSession = await login(browser, ADMIN_USER);
    const user = await loginSession.client.user.self.query();
    await use(new Session(loginSession, user));
  },
  devSession: async ({ browser, adminSession }, use) => {
    const loginSession = await login(browser, DEV_USER);
    const user = await loginSession.client.user.self.query();
    const devSession = new Session(loginSession, user);
    await use(devSession);
    await clearUserPermissions(adminSession.session.client, [user.id]);
  },
  testSession: async ({ browser, adminSession }, use) => {
    const loginSession = await login(browser, TEST_USER);
    const user = await loginSession.client.user.self.query();
    const testSession = new Session(loginSession, user);
    await use(testSession);
    await clearUserPermissions(adminSession.session.client, [user.id]);
  },
  refreshSession: async ({}, use) => {
    await use(refreshSession);
  },
  modifyPermissions: async (
    { adminSession, testSession, devSession, refreshSession, browser },
    use,
  ) => {
    const sessionsByUser: Record<
      Exclude<TestUserId, 'test2@localhost' | 'dev_admin@localhost'>,
      Session
    > = {
      [ADMIN_USER]: adminSession,
      [DEV_USER]: devSession,
      [TEST_USER]: testSession,
    };

    await use(async (userId, permissions) => {
      await adminSession.session.client.userPermissions.setPermissions.mutate([
        {
          userId,
          permissions,
        },
      ]);

      sessionsByUser[userId].session = await refreshSession(
        browser,
        userId,
        sessionsByUser[userId].session.page,
      );
      sessionsByUser[userId].user = await sessionsByUser[userId].session.client.user.self.query();
    });
  },
});
