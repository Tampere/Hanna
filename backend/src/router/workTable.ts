import { z } from 'zod';

import { textToSearchTerms } from '@backend/components/project/search';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  WorkTableRow,
  WorkTableSearch,
  workTableRowSchema,
  workTableSearchSchema,
} from '@shared/schema/workTable';

async function workTableSearch(input: WorkTableSearch) {
  const objectNameSearch = textToSearchTerms(input.projectObjectName, { minTermLength: 3 });
  const projectNameSearch = textToSearchTerms(input.projectName, { minTermLength: 3 });

  const {
    startDate = null,
    endDate = null,
    projectObjectType = [],
    projectObjectCategory = [],
    projectObjectUsage = [],
    projectObjectLifecycleState = [],
  } = input;

  const query = sql.type(workTableRowSchema)`
  WITH search_results AS (
    SELECT
      project_object.*,
      project.project_name
    FROM app.project_object
    INNER JOIN app.project ON project.id = project_object.project_id
    INNER JOIN app.project_investment ON project_investment.id = project.id
    WHERE project_object.deleted = false
      -- search date range intersection
      AND daterange(${startDate}, ${endDate}, '[]') && daterange(project_object.start_date, project_object.end_date, '[]')
      AND (${objectNameSearch}::text IS NULL OR to_tsquery('simple', ${objectNameSearch}) @@ to_tsvector('simple', project_object.object_name))
      AND (${projectNameSearch}::text IS NULL OR to_tsquery('simple', ${projectNameSearch}) @@ to_tsvector('simple', project.project_name))
      -- empty array means match all, otherwise check for intersection
      AND (
        ${sql.array(projectObjectType, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE project_object.id = project_object_type.project_object_id) &&
        ${sql.array(projectObjectType, 'text')}
      )
      AND (
        ${sql.array(projectObjectCategory, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE project_object.id = project_object_category.project_object_id) &&
        ${sql.array(projectObjectCategory ?? [], 'text')}
      )
      AND (
        ${sql.array(projectObjectUsage, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE project_object.id = project_object_usage.project_object_id) &&
        ${sql.array(projectObjectUsage, 'text')}
      )
      AND (
        ${sql.array(projectObjectLifecycleState, 'text')} = '{}'::TEXT[] OR
        (project_object.lifecycle_state).id = ANY(${sql.array(projectObjectLifecycleState, 'text')})
      )
  )
  SELECT
    search_results.id AS "id",
    object_name AS "projectObjectName",
    (search_results.lifecycle_state).id AS "projectObjectState",
    jsonb_build_object(
        'startDate', start_date,
        'endDate', end_date
    ) AS "projectDateRange",
    jsonb_build_object(
        'projectId', project_id,
        'projectName', project_name
    ) AS "projectLink",
    (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE search_results.id = project_object_type.project_object_id) AS "projectObjectType",
    (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE search_results.id = project_object_category.project_object_id) AS "projectObjectCategory",
    (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE search_results.id = project_object_usage.project_object_id) AS "projectObjectUsage",
    jsonb_build_object(
        'rakennuttajaUser', rakennuttaja_user,
        'suunnitteluttajaUser', suunnitteluttaja_user
    ) AS "projectObjectPersonInfo",
    -- FIXME: yearly values, that are summed in the UI
    '{"budget": 12500000, "actual": 147500000}'::JSONB AS "projectObjectFinances"
  FROM search_results
  `;

  return getPool().any(query);
}

async function workTableUpdate(_input: WorkTableRow[]) {}

export const createWorkTableRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(workTableSearchSchema).query(async ({ input }) => {
      return workTableSearch(input);
    }),
    update: t.procedure.input(z.array(workTableRowSchema)).mutation(async ({ input }) => {
      return workTableUpdate(input);
    }),
  });
