import { getPool, sql } from '@backend/db';

import { userSchema } from '@shared/schema/user';

const userSelectFragment = sql.fragment`
  SELECT id, email, name FROM app.user
`;

export async function getAllUsers() {
  const users = await getPool().many(sql.type(userSchema)`
    ${userSelectFragment}
    ORDER BY name ASC
  `);
  return users;
}

export async function getAllNonExtUsers() {
  const users = await getPool().many(sql.type(userSchema)`
    SELECT id, email, name FROM app.user
    WHERE email NOT LIKE '%@ext.tampere.fi%'
    ORDER BY name ASC
  `);
  return users;
}

export async function getUser(id: string) {
  return await getPool().one(sql.type(userSchema)`
    ${userSelectFragment}
    WHERE id = ${id}
  `);
}
