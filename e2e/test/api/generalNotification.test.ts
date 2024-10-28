// TRPC api tests for permissions
import { expect } from '@playwright/test';
import { clearGeneralNotifications } from '@utils/db.js';
import { test } from '@utils/fixtures.js';
import { ADMIN_USER } from '@utils/users.js';

const newNotification = {
  id: null,
  title: 'Test notification',
  message: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test message' }] }],
  },
};

test.describe('General notification endpoints', () => {
  test.afterEach(async () => {
    await clearGeneralNotifications();
  });

  test('get general notification', async ({ adminSession }) => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    const result = await adminSession.client.generalNotification.get.query({
      id: notification.id,
    });
    expect({ ...result, publisher: ADMIN_USER }).toEqual(notification);
  });

  test('delete general notification', async ({ adminSession }) => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await adminSession.client.generalNotification.delete.mutate({ id: notification.id });
    const result = await adminSession.client.generalNotification.get.query({
      id: notification.id,
    });
    expect(result).toBeNull();
  });

  test('upsert general notification', async ({ adminSession }) => {
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

  test('search general notifications', async ({ adminSession }) => {
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

  test('get all general notifications', async ({ adminSession }) => {
    await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await adminSession.client.generalNotification.upsert.mutate({
      ...newNotification,
      title: 'Another notification',
    });
    const notifications = await adminSession.client.generalNotification.getAll.query();
    expect(notifications).toHaveLength(2);
  });
});
