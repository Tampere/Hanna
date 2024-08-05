import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';

import { userSchema } from '@shared/schema/user.js';

const userSelectFragment = sql.fragment`
  SELECT id, email, name, role, permissions FROM app.user
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
    ${userSelectFragment}
    ${env?.displayExtUsers ? sql.fragment`` : sql.fragment`WHERE email NOT LIKE '%ext%'`}
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

export async function searchUsers(userName: string) {
  return getPool().any(sql.type(userSchema)`
  SELECT
    id AS "userId",
    email AS "userEmail",
    "name" AS "userName",
    "role" AS "userRole",
    COALESCE(("role" = 'Hanna.Admin'), false) AS "isAdmin",
    permissions
  FROM app.user
  WHERE name ILIKE ${'%' + userName + '%'}`);
}
