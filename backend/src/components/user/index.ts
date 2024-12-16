import { z } from 'zod';

import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';

import { nonEmptyString } from '@shared/schema/common.js';
import { userSchema } from '@shared/schema/user.js';
import {
  FilterType,
  UserSavedSearchParams,
  userSavedSearchFilterSchema,
} from '@shared/schema/userSavedSearchFilters.js';

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

export async function getSavedSearchFilters(userId: string, filterType: FilterType) {
  const filterTypeMap = {
    projectSearch: sql.fragment`project_search_filters`,
    projectObjectSearch: sql.fragment`project_object_search_filters`,
    worktableSearch: sql.fragment`worktable_filters`,
  };

  const filterTypeAliases = {
    projectSearch: sql.fragment`"projectSearch"`,
    projectObjectSearch: sql.fragment`"projectObjectSearch"`,
    worktableSearch: sql.fragment`"worktableSearch"`,
  };

  const result = await getPool().any(sql.untyped`
    SELECT
      id AS "filterId",
      filter_name as "filterName",
      ${filterTypeMap[filterType]} AS ${filterTypeAliases[filterType]}
    FROM app.user_search_filters
    WHERE user_id = ${userId} AND ${filterTypeMap[filterType]} IS NOT NULL
    ORDER BY filter_name`);

  return result.map((obj) => userSavedSearchFilterSchema.parse(obj));
}

export async function upsertSavedSearchFilters(
  userId: string,
  filterName: string,
  projectSearch?: UserSavedSearchParams['projectSearch'],
  projectObjectSearch?: UserSavedSearchParams['projectObjectSearch'],
  worktableSearch?: UserSavedSearchParams['worktableSearch'],
  filterId?: string,
) {
  const projectSearchInput = JSON.stringify(projectSearch) ?? null;
  const projectObjectSearchInput = JSON.stringify(projectObjectSearch) ?? null;
  const worktableSearchInput = JSON.stringify(worktableSearch) ?? null;

  if (filterId) {
    return getPool().one(sql.type(z.object({ filterId: nonEmptyString }))`
      UPDATE app.user_search_filters
      SET
        filter_name = ${filterName},
        project_search_filters = ${projectSearchInput},
        project_object_search_filters = ${projectObjectSearchInput},
        worktable_filters = ${worktableSearchInput}
      WHERE id = ${filterId}
      RETURNING id AS "filterId";`);
  } else {
    return getPool().one(sql.type(z.object({ filterId: nonEmptyString }))`
      INSERT INTO app.user_search_filters (user_id, filter_name, project_search_filters, project_object_search_filters, worktable_filters)
      VALUES (${userId}, ${filterName}, ${projectSearchInput}, ${projectObjectSearchInput}, ${worktableSearchInput})
      RETURNING id AS "filterId";`);
  }
}

export async function deleteSavedSearchFilter(filterId: string) {
  return getPool().query(sql.untyped`
    DELETE FROM app.user_search_filters
    WHERE id = ${filterId}`);
}
