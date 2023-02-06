import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import { userSchema } from '@shared/schema/user';

export const createUserRouter = (t: TRPC) =>
  t.router({
    getUsers: t.procedure.query(async () => {
      const users = await getPool().many(sql.type(userSchema)`
        SELECT id, email, name FROM app.user
      `);
      return users;
    }),
  });
