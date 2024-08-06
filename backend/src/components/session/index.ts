import { getPool, sql } from '@backend/db.js';

export async function invalidateUserSession(userIds: string[]) {
  return getPool().any(
    sql.untyped`
      DELETE FROM app.session
      WHERE (sess->>'passport')::jsonb->>'id' = ANY(${sql.array(userIds, 'text')})`,
  );
}
