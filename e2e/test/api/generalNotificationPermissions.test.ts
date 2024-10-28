// TRPC api tests for permissions
import { expect } from '@playwright/test';
import { test } from '@utils/fixtures.js';

const newNotification = {
  id: null,
  title: 'Test notification',
  message: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test message' }] }],
  },
};

test.describe('permission testing', () => {
  test.afterEach(async ({ refreshAllSessions }) => {
    refreshAllSessions();
  });

  test('without admin permissions, general notifications cannot be created', async ({
    testSession,
  }) => {
    await expect(
      testSession.client.generalNotification.upsert.mutate(newNotification),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin users can create general notifications', async ({ adminSession }) => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    expect(notification.title).toBe(newNotification.title);
    expect(notification.message).toEqual(newNotification.message);
  });

  test('without admin permissions, general notifications cannot be deleted', async ({
    adminSession,
    testSession,
  }) => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    await expect(
      testSession.client.generalNotification.delete.mutate({ id: notification.id }),
    ).rejects.toThrowError('error.insufficientPermissions');
  });

  test('admin users can delete general notifications', async ({ adminSession }) => {
    const notification =
      await adminSession.client.generalNotification.upsert.mutate(newNotification);
    const deletedNotificationId = await adminSession.client.generalNotification.delete.mutate({
      id: notification.id,
    });
    expect(deletedNotificationId).toEqual({ id: notification.id });
  });
});
