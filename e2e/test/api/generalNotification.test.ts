// TRPC api tests for permissions
import { expect, test } from '@playwright/test';
import { clearGeneralNotifications, clearObjects } from '@utils/db.js';
import { login } from '@utils/page.js';
import { ADMIN_USER, UserSessionObject } from '@utils/users.js';

const newNotification = {
  id: null,
  title: 'Test notification',
  message: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test message' }] }],
  },
};

test.describe('General notification endpoints', () => {
  let adminSession: UserSessionObject;

  test.beforeAll(async ({ browser }) => {
    adminSession = await login(browser, ADMIN_USER);
    expect((await adminSession.client.user.self.query()).email).toBe(ADMIN_USER);
  });

  test.afterEach(async () => {
    await clearGeneralNotifications();
  });

  test('get general notification', async () => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    const result = await adminSession.client.generalNotification.get.query({ id: notification.id });
    expect({ ...result, publisher: ADMIN_USER }).toEqual(notification);
  });

  test('delete general notification', async () => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await adminSession.client.generalNotification.delete.mutate({ id: notification.id });
    const result = await adminSession.client.generalNotification.get.query({ id: notification.id });
    expect(result).toBeNull();
  });

  test('upsert general notification', async () => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    expect(notification.title).toBe(newNotification.title);
    expect(notification.message).toEqual(newNotification.message);

    const updatedNotification = {
      ...notification,
      title: 'Updated title',
      message: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Updated message' }] }],
      },
    };

    const updated =
      await adminSession.client.generalNotification.upsert.mutate(updatedNotification);
    expect(updated).toEqual(updatedNotification);
  });

  test('search general notifications', async () => {
    // Same as getAll at the moment since no search filters are implemented
    await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await adminSession.client.generalNotification.upsert.mutate({
      ...newNotification,
      title: 'Another notification',
    });
    const notifications = await adminSession.client.generalNotification.search.query();
    const searchCount = await adminSession.client.generalNotification.getSearchCount.query();
    expect(notifications).toHaveLength(2);
    expect(searchCount).toStrictEqual({ count: 2 });
  });

  test('get all general notifications', async () => {
    await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await adminSession.client.generalNotification.upsert.mutate({
      ...newNotification,
      title: 'Another notification',
    });
    const notifications = await adminSession.client.generalNotification.getAll.query();
    expect(notifications).toHaveLength(2);
  });
});
