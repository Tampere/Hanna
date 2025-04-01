import { DatabaseTransactionConnection, IdleTransactionTimeoutError } from 'slonik';
import { z } from 'zod';

import { getPool, sql } from '@backend/db.js';

import {
  GeneralNotification,
  UpsertGeneralNotification,
  dbGeneralNotificationSchema,
  searchGeneralNotificationsSchema,
} from '@shared/schema/generalNotification.js';

import { addAuditEvent } from '../audit.js';

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

    // Collect image ids in updated message
    const imageIds: number[] = existingNotification
      ? notification.message.content
          .filter((section: { type: string }) => section.type === 'image')
          .map((imageSection: { attrs: { src: any } }) =>
            Number(imageSection.attrs.src.split('/').at(-1)),
          )
      : [];
    if (existingNotification && notification.id) {
      await deleteUnusedImages(notification.id, tx, imageIds);
    }

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
    await deleteUnusedImages(id, tx);
    return tx.maybeOne(sql.untyped`${getDeleteGeneralNotificationFragment(id)}`);
  });
}

async function deleteUnusedImages(
  notificationId: string,
  tx?: DatabaseTransactionConnection,
  imageIdsToKeep: number[] = [],
) {
  const conn = tx ?? getPool();

  const toBeDeletedMessage = await conn.maybeOne(
    sql.type(
      dbGeneralNotificationSchema.pick({ message: true }),
    )`SELECT message FROM app.general_notification WHERE id=${notificationId}`,
  );
  if (!toBeDeletedMessage) return;

  const imageIds: number[] = toBeDeletedMessage.message.content
    .filter((section: { type: string }) => section.type === 'image')
    .map((imageSection: { attrs: { src: string } }) =>
      Number(imageSection.attrs.src.split('/').at(-1)),
    )
    .filter(Number);
  const removeIds = imageIds.filter((imageNumber) => !imageIdsToKeep.includes(imageNumber));
  await conn.maybeOne(
    sql.untyped`DELETE FROM app.images WHERE id = ANY(${sql.array(removeIds, 'int4')})`,
  );
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
