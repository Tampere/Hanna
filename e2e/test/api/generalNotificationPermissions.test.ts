// TRPC api tests for permissions
import test, { expect } from '@playwright/test';
import { login, refreshSession } from '@utils/page';
import {
  ADMIN_USER,
  DEV_USER,
  TEST_USER,
  UserSessionObject,
  clearUserPermissions,
} from '@utils/users';

const newNotification = {
  id: null,
  title: 'Test notification',
  message: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test message' }] }],
  },
};

test.describe('permission testing', () => {
  let adminSession: UserSessionObject;
  let devSession: UserSessionObject;
  let testSession: UserSessionObject;

  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    devSession = await login(browser, DEV_USER);
    testSession = await login(browser, TEST_USER);

    expect((await adminSession.client.user.self.query()).email).toBe(ADMIN_USER);
    expect((await devSession.client.user.self.query()).email).toBe(DEV_USER);
    expect((await testSession.client.user.self.query()).email).toBe(TEST_USER);
  });

  test.afterEach(async ({ browser }) => {
    await clearUserPermissions(adminSession.client, [DEV_USER, TEST_USER]);

    devSession = await refreshSession(browser, DEV_USER, devSession.page);
    testSession = await refreshSession(browser, TEST_USER, testSession.page);
  });

  test('without admin permissions, general notifications cannot be created', async () => {
    await expect(
      testSession.client.generalNotification.upsert.mutate(newNotification),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin users can create general notifications', async () => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    expect(notification.title).toBe(newNotification.title);
    expect(notification.message).toEqual(newNotification.message);
  });

  test('without admin permissions, general notifications cannot be deleted', async () => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await expect(
      testSession.client.generalNotification.delete.mutate({ id: notification.id }),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin users can delete general notifications', async () => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    const deletedNotificationId = await adminSession.client.generalNotification.delete.mutate({
      id: notification.id,
    });
    expect(deletedNotificationId).toEqual({ id: notification.id });
  });
});
