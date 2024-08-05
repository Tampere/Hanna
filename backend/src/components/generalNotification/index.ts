import { z } from 'zod';

import { getPool, sql } from '@backend/db';

import {
  UpsertGeneralNotification,
  dbGeneralNotificationSchema,
  searchGeneralNotificationsSchema,
} from '@shared/schema/generalNotification';

import { addAuditEvent } from '../audit';

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
  DELETE FROM app.general_notification WHERE id = ${id} RETURNING id`;
}

export async function upsertGeneralNotification(
  notification: UpsertGeneralNotification,
  userId: string,
) {
  return getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'generalNotification.upsert',
      eventData: { notification },
      eventUser: userId,
    });
    const existingNotification = notification.id
      ? await tx.maybeOne(
          sql.type(dbGeneralNotificationSchema)`
        ${getGeneralNotificationFragment(true)} WHERE gn.id = ${notification.id}`,
        )
      : null;

    return notification?.id && existingNotification
      ? await tx.one(sql.type(dbGeneralNotificationSchema)`
      UPDATE app.general_notification
      SET
        title = ${notification.title},
        message = ${JSON.stringify(notification.message)},
        publisher = ${userId}
      WHERE id = ${notification.id}
      RETURNING id, title, message, created_at "createdAt", publisher
        `)
      : await tx.one(sql.type(dbGeneralNotificationSchema)`
        INSERT INTO app.general_notification (title, message, publisher)
        VALUES (
            ${notification.title},
            ${JSON.stringify(notification.message)},
            ${userId})
        RETURNING id, title, message, created_at "createdAt", publisher
        `);
  });
}

export function getGeneralNotification(id: string) {
  return getPool().maybeOne(sql.type(dbGeneralNotificationSchema)`
    ${getGeneralNotificationFragment(true)} WHERE gn.id = ${id}`);
}

export function deleteGeneralNotification(id: string, userId: string) {
  return getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'generalNotification.delete',
      eventData: { id },
      eventUser: userId,
    });
    return tx.maybeOne(sql.untyped`${getDeleteGeneralNotificationFragment(id)}`);
  });
}

export function getGeneralNotificationSearchCount() {
  return getPool().one(sql.untyped`SELECT COUNT(id) FROM app.general_notification`);
}

export function searchGeneralNotifications() {
  return getPool().any(sql.type(searchGeneralNotificationsSchema)`
    ${getGeneralNotificationFragment(true)} ORDER BY gn.created_at DESC`);
}

export function getAllGeneralNotifications() {
  return getPool().any(
    sql.type(
      dbGeneralNotificationSchema,
    )`${getGeneralNotificationFragment()} ORDER BY gn.created_at DESC`,
  );
}

export function getRecentGeneralNotificationCount() {
  return getPool().one(sql.type(z.object({ count: z.number() }))`
  SELECT count(id) FROM app.general_notification WHERE created_at >= now() - INTERVAL '3 day'`);
}
