import { z } from 'zod';

import { getPool, sql } from '@backend/db.js';

const mailEventRowSchema = z.object({
  id: z.string(),
  sentAt: z.date(),
  sentBy: z.string().nullable(),
  templateName: z.string().nullable(),
  to: z.array(z.string()),
  cc: z.array(z.string()),
  bcc: z.array(z.string()),
  subject: z.string().nullable(),
  html: z.string().nullable(),
});

export async function getMailEvents(projectId: string) {
  return await getPool().any(sql.type(mailEventRowSchema)`
    SELECT
      event.id,
      event.sent_at AS "sentAt",
      "user".name AS "sentBy",
      template_name AS "templateName",
      event.to AS "to",
      event.cc AS "cc",
      event.bcc AS "bcc",
      event.subject AS "subject",
      event.html AS "html"
    FROM
      app.mail_event event
      LEFT JOIN app.user "user" ON event.sent_by = "user".id
    WHERE project_id = ${projectId}
    ORDER BY sent_at DESC
  `);
}
