import { sql } from 'slonik';

import { UpsertUserInput, userSchema } from '@shared/schema/user';

import { getPool } from './db';

export async function upsertUser(user: UpsertUserInput) {
  return getPool().maybeOne(sql.type(userSchema)`
    INSERT INTO app.user (id, email, name, role)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.role})
    ON CONFLICT (id)
      DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role=EXCLUDED.role, updated_at = NOW()
    RETURNING id, email, name, role, permissions
  `);
}
