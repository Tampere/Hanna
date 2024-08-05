import stringify from 'fast-json-stable-stringify';
import { DatabaseTransactionConnection } from 'slonik';

import { sql } from '@backend/db.js';

import { User } from '@shared/schema/user.js';

interface AuditEvent {
  eventType: string;
  eventData: object;
  eventUser: User['id'];
}

export function addAuditEvent(tx: DatabaseTransactionConnection, entry: AuditEvent) {
  return tx.query(sql.untyped`
    INSERT INTO app.audit_event (event_type, event_data, event_user, event_timestamp)
    VALUES (${entry.eventType}, ${stringify(entry.eventData)}::jsonb, ${entry.eventUser}, now())
  `);
}
