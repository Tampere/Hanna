import { getPool, sql } from '@backend/db.js';

import { detailplanNotificationMailEventSchema } from '@shared/schema/project/detailplan.js';

export async function getMailEvents(projectId: string) {
  return await getPool().any(sql.type(detailplanNotificationMailEventSchema)`
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
