import { PassportUser } from 'fastify';
import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from './db';

export async function upsertUser(user: PassportUser) {
  getPool().any(sql.type(z.any())`
    INSERT INTO app.user (id, email, name)
    VALUES (${user.id}, ${user.email}, ${user.name})
    ON CONFLICT (id)
      DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
  `);
}
