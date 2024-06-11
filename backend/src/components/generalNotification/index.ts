import { getPool, sql } from '@backend/db';

import {
  UpsertGeneralNotification,
  dbGeneralNotificationSchema,
  searchGeneralNotificationsSchema,
} from '@shared/schema/generalNotification';

function getGeneralNotificationFragment(withId: boolean = true) {
  return sql.fragment`
  SELECT
      ${withId ? sql.fragment`gn.id,` : sql.fragment``}
      gn.title,
      gn.message,
      gn.created_at "createdAt",
      u.name "publisher"
  FROM app.general_notification gn
  LEFT JOIN app.user u ON gn.publisher = u.id`;
}

function getDeleteGeneralNotificationFragment(id: string) {
  return sql.fragment`
  DELETE FROM app.general_notification WHERE id = ${id}`;
}

export async function upsertGeneralNotification(
  notification: UpsertGeneralNotification,
  userId: string,
) {
  const existingNotification = notification.id
    ? await getPool().maybeOne(
        sql.type(dbGeneralNotificationSchema)`
        ${getGeneralNotificationFragment(true)} WHERE id = ${notification.id}`,
      )
    : null;

  let result;
  if (notification?.id && existingNotification) {
    // Update existing notification
    result = await getPool().one(sql.untyped`
      UPDATE app.general_notification
      SET
        title = ${notification.title},
        message = ${JSON.stringify(notification.message)},
        publisher = ${userId}
      WHERE id = ${notification.id}
      RETURNING id, title, message, created_at "createdAt", publisher
        `);
  } else {
    // Add new notification
    result = await getPool().one(sql.untyped`
        INSERT INTO app.general_notification (title, message, publisher)
        VALUES (
            ${notification.title},
            ${JSON.stringify(notification.message)},
            ${userId})
        RETURNING id, title, message, created_at "createdAt", publisher
        `);
  }
  return result;
}

export function getGeneralNotification(id: string) {
  return getPool().maybeOne(sql.type(dbGeneralNotificationSchema)`
    ${getGeneralNotificationFragment(true)} WHERE gn.id = ${id}`);
}

export function deleteGeneralNotification(id: string) {
  return getPool().maybeOne(sql.untyped`${getDeleteGeneralNotificationFragment(id)}`);
}

export function getGeneralNotificationSearchCount() {
  return getPool().one(sql.untyped`SELECT COUNT(id) FROM app.general_notification`);
}

export function searchGeneralNotifications() {
  return getPool().any(sql.type(searchGeneralNotificationsSchema)`
    ${getGeneralNotificationFragment(true)}`);
}

export function getAllGeneralNotifications() {
  return getPool().any(sql.type(dbGeneralNotificationSchema)`${getGeneralNotificationFragment()}`);
}
