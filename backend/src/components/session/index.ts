import { DatabaseTransactionConnection } from 'slonik';

import { getPool, sql } from '@backend/db.js';

export async function invalidateUserSession(userIds: string[], tx?: DatabaseTransactionConnection) {
  const conn = tx ?? getPool();
  return conn.any(
    sql.untyped`
      DELETE FROM app.session
      WHERE (sess->>'passport')::jsonb->>'id' = ANY(${sql.array(userIds, 'text')})`,
  );
}
