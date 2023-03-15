import { getPool, sql } from '@backend/db';

import { userSchema } from '@shared/schema/user';

const userSelectFragment = sql.fragment`
  SELECT id, email, name FROM app.user
`;

export async function getAllUsers() {
  const users = await getPool().many(sql.type(userSchema)`
    ${userSelectFragment}
  `);
  return users;
}

export async function getUser(id: string) {
  return await getPool().one(sql.type(userSchema)`
    ${userSelectFragment}
    WHERE id = ${id}
  `);
}
