import { textToSearchTerms } from '@backend/components/project/search';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';
import { getProjectObjects, upsertProjectObject } from '@backend/router/projectObject';

import { UpsertProjectObject } from '@shared/schema/projectObject';
import {
  WorkTableSearch,
  WorkTableUpdate,
  workTableRowSchema,
  workTableSearchSchema,
  workTableUpdateSchema,
} from '@shared/schema/workTable';

async function workTableSearch(input: WorkTableSearch) {
  const objectNameSearch = textToSearchTerms(input.projectObjectName, { minTermLength: 3 });
  const projectNameSearch = textToSearchTerms(input.projectName, { minTermLength: 3 });

  const {
    startDate = null,
    endDate = null,
    objectType = [],
    objectCategory = [],
    objectUsage = [],
    lifecycleState = [],
    financesRange,
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
        ${sql.array(objectType, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE project_object.id = project_object_type.project_object_id) &&
        ${sql.array(objectType, 'text')}
      )
      AND (
        ${sql.array(objectCategory, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE project_object.id = project_object_category.project_object_id) &&
        ${sql.array(objectCategory ?? [], 'text')}
      )
      AND (
        ${sql.array(objectUsage, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE project_object.id = project_object_usage.project_object_id) &&
        ${sql.array(objectUsage, 'text')}
      )
      AND (
        ${sql.array(lifecycleState, 'text')} = '{}'::TEXT[] OR
        (project_object.lifecycle_state).id = ANY(${sql.array(lifecycleState, 'text')})
      )
  ), po_budget AS (
    SELECT
      project_object_id,
      COALESCE(SUM(budget.amount), null) AS budget,
      COALESCE(SUM(budget.forecast), null) AS forecast,
      COALESCE(SUM(budget.kayttosuunnitelman_muutos), null) AS kayttosuunnitelman_muutos
    FROM app.budget
    WHERE ${
      financesRange === 'allYears' ? sql.fragment`true` : sql.fragment`year = ${financesRange}`
    }
    GROUP BY project_object_id
  ), po_actual AS (
    SELECT
      project_object.id AS po_id,
      SUM(value_in_currency_subunit) AS total
    FROM app.sap_actuals_item
    INNER JOIN app.project_object ON project_object.sap_wbs_id = sap_actuals_item.wbs_element_id
    WHERE ${
      financesRange === 'allYears'
        ? sql.fragment`true`
        : sql.fragment`EXTRACT(YEAR FROM posting_date) = ${financesRange}`
    }
    GROUP BY project_object.id
  )
  SELECT
    search_results.id AS "id",
    object_name AS "objectName",
    (search_results.lifecycle_state).id AS "lifecycleState",
    jsonb_build_object(
        'startDate', start_date,
        'endDate', end_date
    ) AS "dateRange",
    jsonb_build_object(
        'projectId', project_id,
        'projectName', project_name
    ) AS "projectLink",
    (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE search_results.id = project_object_type.project_object_id) AS "objectType",
    (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE search_results.id = project_object_category.project_object_id) AS "objectCategory",
    (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE search_results.id = project_object_usage.project_object_id) AS "objectUsage",
    jsonb_build_object(
        'rakennuttajaUser', rakennuttaja_user,
        'suunnitteluttajaUser', suunnitteluttaja_user
    ) AS "operatives",
    po_budget.budget AS "budget",
    po_actual.total AS "actual",
    po_budget.forecast AS "forecast",
    po_budget.kayttosuunnitelman_muutos AS "kayttosuunnitelmanMuutos"
  FROM search_results
  LEFT JOIN po_budget ON po_budget.project_object_id = search_results.id
  LEFT JOIN po_actual ON po_actual.po_id = search_results.id
  ORDER BY object_name ASC
  `;

  return getPool().any(query);
}

async function workTableUpdate(input: WorkTableUpdate, userId: string) {
  const updates = Object.entries(input).map(([projectObjectId, projectObject]) => {
    const { budgetYear, budget, forecast, kayttosuunnitelmanMuutos, ...poUpdate } = projectObject;
    return {
      ...poUpdate,
      startDate: projectObject.dateRange?.startDate,
      endDate: projectObject.dateRange?.endDate,
      rakennuttajaUser: projectObject.operatives?.rakennuttajaUser,
      suunnitteluttajaUser: projectObject.operatives?.suunnitteluttajaUser,
      projectObjectId: projectObjectId,
      budgetUpdate: {
        budgetItems: [
          {
            year: budgetYear,
            amount: budget,
            forecast,
            kayttosuunnitelmanMuutos,
          },
        ],
      },
    } as UpsertProjectObject;
  });

  return await getPool().transaction(async (tx) => {
    await Promise.all(updates.map((update) => upsertProjectObject(tx, update, userId)));
    return getProjectObjects(tx, Object.keys(input));
  });
}

export const createWorkTableRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(workTableSearchSchema).query(async ({ input }) => {
      return workTableSearch(input);
    }),
    // XXX: permissions, only owner and those with write permissions can update
    update: t.procedure.input(workTableUpdateSchema).mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      return workTableUpdate(input, userId);
    }),
  });
