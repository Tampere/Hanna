import { CommonQueryMethods } from 'slonik';
import { z } from 'zod';

import { MailField, MailUserContact } from '@backend/components/mail/templates.js';
import { getPool, sql } from '@backend/db.js';

import { User } from '@shared/schema/user.js';

const contactSchema = z.object({ name: z.string(), email: z.string() });

/**
 * Contact details of a user for request emails.
 * Phone number source is still open, so it is always null for now - wire it up here.
 */
export async function getUserContact(
  userId: User['id'],
  conn: CommonQueryMethods = getPool(),
): Promise<MailUserContact> {
  const user = await conn.maybeOne(sql.type(contactSchema)`
    SELECT name, email FROM app.user WHERE id = ${userId}
  `);
  return { name: user?.name ?? userId, email: user?.email ?? '', phone: null };
}

/** Formats a user as a single field value: "Name, email, puh. -" */
export function formatUserContact(contact: MailUserContact) {
  return [contact.name, contact.email || null, `puh. ${contact.phone ?? '-'}`]
    .filter(Boolean)
    .join(', ');
}

export function userContactField(label: string, contact: MailUserContact): MailField {
  return { label, value: formatUserContact(contact) };
}
