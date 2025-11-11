import { z } from 'zod';

import { textToTsSearchTerms } from '@backend/components/project/search.js';
import { getProjectObjectBudget } from '@backend/components/projectObject/index.js';
import { upsertProjectObject } from '@backend/components/projectObject/investment.js';
import { refreshProjectObjectSapActuals } from '@backend/components/sap/actuals.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';
import { TRPC } from '@backend/router/index.js';

import {
  PlanningTableRow,
  PlanningTableSearch,
  ProjectObjectRow,
  planningTableRowResult,
  planningTableRowSchema,
  planningTableSearchSchema,
  planningUpdateSchema,
} from '@shared/schema/planningTable.js';
import { hasPermission, isAdmin } from '@shared/schema/userPermissions.js';

import { getWorkTableYearRange } from './workTable.js';

// Creates a PlanningTable view similar to WorkTable
// Shows projects/project objects as rows with yearly columns (Estimate/Actual)
// Actuals are only shown for past and current years, not future years
async function planningTableSearch(input: PlanningTableSearch) {
  const {
    objectType = [],
    objectCategory = [],
    objectUsage = [],
    lifecycleState = [],
    objectStage = [],
    objectParticipantUser = '',
    rakennuttajaUsers = [],
    suunnitteluttajaUsers = [],
    company = [],
    committee = [],
    projectTarget = [],
    palmGrouping = [],
  } = input;

  const objectNameSearch = textToTsSearchTerms(input.projectObjectName, { minTermLength: 3 });
  const projectNameSearch = textToTsSearchTerms(input.projectName, { minTermLength: 3 });
  const objectNameSubstringSearch =
    input.projectObjectName && input.projectObjectName?.length >= 3 ? input.projectObjectName : '';
  const projectNameSubstringSearch =
    input.projectName && input.projectName?.length >= 3 ? input.projectName : '';

  const currentYear = new Date().getFullYear();
  const startYear = input.yearRange?.start ?? currentYear;
  const endYear = input.yearRange?.end ?? currentYear + 15;

  // Convert years to dates for comparison
  const rangeStartDate = `${startYear}-01-01`;
  const rangeEndDate = `${endYear}-12-31`;

  const query = sql.type(planningTableRowResult)`
    WITH candidate_projects AS (
      SELECT DISTINCT p.id, p.project_name, p.start_date, p.end_date
      FROM app.project p
      INNER JOIN app.project_investment pi ON pi.id = p.id
      WHERE p.deleted = false
        AND (${projectNameSearch}::text IS NULL OR to_tsquery('simple', ${projectNameSearch}) @@ to_tsvector('simple', p.project_name) OR  p.project_name LIKE '%' || ${projectNameSubstringSearch} || '%')
        -- Filter by year range: project date range must overlap with selected year range
        AND (
          (p.start_date IS NULL OR p.end_date IS NULL) OR
          (p.start_date <= ${rangeEndDate}::date AND p.end_date >= ${rangeStartDate}::date)
        )
        -- Sitovuus
        AND (
          ${sql.array(projectTarget, 'text')} = '{}'::TEXT[] OR
          (pi.target).id = ANY(${sql.array(projectTarget, 'text')}::TEXT[])
        )
        -- Elinkaaren tila
        AND (
          ${sql.array(lifecycleState, 'text')} = '{}'::TEXT[] OR
          (p.lifecycle_state).id = ANY(${sql.array(lifecycleState, 'text')})
        )
        -- Lautakunta
        AND (
          ${sql.array(committee, 'text')}::TEXT[] = '{}'::TEXT[] OR
          EXISTS (
            SELECT 1 FROM app.project_committee pc
            WHERE pc.project_id = p.id AND (pc.committee_type).id = ANY(${sql.array(
              committee,
              'text',
            )}::TEXT[])
          )
        )
        AND (
          ${sql.array(palmGrouping, 'text')}::TEXT[] = '{}'::TEXT[] OR
          (pi.palm_grouping).id = ANY(${sql.array(palmGrouping, 'text')}::TEXT[])
        )
         AND (
          ${sql.array(projectTarget, 'text')}::TEXT[] = '{}'::TEXT[] OR
          (pi.target).id = ANY(${sql.array(projectTarget, 'text')}::TEXT[])
        )
    ),
    filtered_project_objects AS (
      SELECT po.id, po.object_name, po.project_id, p.project_name, po.start_date, po.end_date
      FROM app.project_object po
      INNER JOIN app.project_object_investment poi ON poi.project_object_id = po.id
      INNER JOIN app.project p ON p.id = po.project_id
      INNER JOIN candidate_projects cp ON cp.id = p.id
      LEFT JOIN app.project_object_user_role pour ON po.id = pour.project_object_id
      WHERE po.deleted = false
        AND (${objectNameSearch}::text IS NULL OR to_tsquery('simple', ${objectNameSearch}) @@ to_tsvector('simple', po.object_name) OR po.object_name LIKE '%' || ${objectNameSubstringSearch} || '%')
        AND (${projectNameSearch}::text IS NULL OR to_tsquery('simple', ${projectNameSearch}) @@ to_tsvector('simple', p.project_name) OR  p.project_name LIKE '%' || ${projectNameSubstringSearch} || '%')
        -- Filter by year range: object date range must overlap with selected year range
        AND (
          (po.start_date IS NULL OR po.end_date IS NULL) OR
          (po.start_date <= ${rangeEndDate}::date AND po.end_date >= ${rangeStartDate}::date)
        )
        -- Kohteen laji
        AND (
          ${sql.array(objectStage, 'text')}::TEXT[] = '{}'::TEXT[] OR
          (poi.object_stage).id = ANY(${sql.array(objectStage, 'text')}::TEXT[])
        )
        -- Tyyppi
        AND (
          ${sql.array(objectType, 'text')} = '{}'::TEXT[] OR
          (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE po.id = project_object_type.project_object_id) &&
          ${sql.array(objectType, 'text')}
        )
        -- Omaisuusluokka
        AND (
          ${sql.array(objectCategory, 'text')} = '{}'::TEXT[] OR
          (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE po.id = project_object_category.project_object_id) &&
          ${sql.array(objectCategory ?? [], 'text')}
        )
        -- Käyttötarkoitus
        AND (
          ${sql.array(objectUsage, 'text')} = '{}'::TEXT[] OR
          (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE po.id = project_object_usage.project_object_id) &&
          ${sql.array(objectUsage, 'text')}
        )
        -- Elinkaaren tila
        AND (
          ${sql.array(lifecycleState, 'text')} = '{}'::TEXT[] OR
          (po.lifecycle_state).id = ANY(${sql.array(lifecycleState, 'text')})
        )
        -- Rakennuttaja tai Suunnitteluttaja)
        AND (
          (${sql.array(rakennuttajaUsers, 'text')}::TEXT[] = '{}'::TEXT[] AND ${sql.array(
            suunnitteluttajaUsers,
            'text',
          )}::TEXT[] = '{}'::TEXT[]) OR
          (
            (${sql.array(rakennuttajaUsers, 'text')}::TEXT[] != '{}'::TEXT[] AND
             pour.role = ('InvestointiKohdeKayttajaRooli', '01')::app.code_id AND
             pour.user_id = ANY(${sql.array(rakennuttajaUsers, 'text')}::TEXT[])
            ) OR
            (${sql.array(suunnitteluttajaUsers, 'text')}::TEXT[] != '{}'::TEXT[] AND
             pour.role = ('InvestointiKohdeKayttajaRooli', '02')::app.code_id AND
             pour.user_id = ANY(${sql.array(suunnitteluttajaUsers, 'text')}::TEXT[])
            )
          )
        )
        -- Yritys
        AND (
          ${sql.array(company, 'text')} = '{}'::TEXT[] OR
          (SELECT array_agg(c.business_id) FROM app.project_object_user_role pour LEFT JOIN app.company_contact cc ON pour.company_contact_id = cc.id LEFT JOIN app.company c ON cc.company_id = c.id WHERE po.id = pour.project_object_id AND c.business_id IS NOT NULL) &&
          ${sql.array(company, 'text')}
        )
        -- Lautakunta
        AND (
          ${sql.array(committee, 'text')}::TEXT[] = '{}'::TEXT[] OR
          EXISTS (
            SELECT 1 FROM app.project_object_committee poc
            WHERE poc.project_object_id = po.id AND (poc.committee_type).id = ANY(${sql.array(
              committee,
              'text',
            )}::TEXT[])
          )
        )
        AND (
          ${sql.array(palmGrouping, 'text')}::TEXT[] = '{}'::TEXT[] OR
          (poi.palm_grouping).id = ANY(${sql.array(palmGrouping, 'text')}::TEXT[])
        )
      GROUP BY po.id, po.object_name, po.project_id, p.project_name
        ${
          objectParticipantUser
            ? sql.fragment`HAVING ${objectParticipantUser} = ANY(array_agg(pour.user_id))`
            : sql.fragment``
        }
    ),
    filtered_projects AS (
      SELECT cp.id, cp.project_name, cp.start_date, cp.end_date
      FROM candidate_projects cp
      WHERE EXISTS (
        SELECT 1 FROM filtered_project_objects fpo
        WHERE fpo.project_id = cp.id
      )
    )
    SELECT * FROM (
      -- Return project rows
      SELECT
        fp.id::text,
        'project' AS type,
        fp.id::text AS "projectId",
        fp.project_name AS "projectName",
        null AS "projectObjectName",
        fp.project_name AS "sortName",
        NULL::jsonb AS "objectDateRange",
        jsonb_build_object('startDate', fp.start_date, 'endDate', fp.end_date) AS "projectDateRange"
      FROM filtered_projects fp

      UNION ALL

      -- Return project object rows
      SELECT
        fpo.id::text,
        'projectObject' AS type,
        fpo.project_id::text AS "projectId",
        fpo.project_name AS "projectName",
        fpo.object_name AS "projectObjectName",
        fpo.object_name AS "sortName",
        jsonb_build_object('startDate', fpo.start_date, 'endDate', fpo.end_date) AS "objectDateRange",
        NULL::jsonb AS "projectDateRange"
      FROM filtered_project_objects fpo
    ) AS results
    ORDER BY "projectName",
             CASE WHEN type = 'project' THEN 0 ELSE 1 END,
             "sortName"
  `;
  const result = await getPool().any(query);

  // Get all project object IDs for budget fetching
  const projectObjectRows = result.filter((row: any) => {
    return row.type === 'projectObject' && Boolean(row.projectObjectName);
  });

  // Fetch budgets and actuals for project objects in parallel
  const budgetPromises = projectObjectRows.map(async (row: any) => {
    try {
      // Fetch budget data
      const budgetData = await getProjectObjectBudget(row.id);

      // Fetch actual values from SAP
      const currentYear = new Date().getFullYear();

      // Transform budget data to match schema expectations and include actual values
      const transformedBudget = budgetData.map((item) => ({
        year: item.year,
        amount: item.budgetItems.amount,
        actual: null,
      }));

      return { rowId: row.id, budget: transformedBudget };
    } catch (error) {
      logger.error(`Failed to fetch budget/actuals for project object ${row.id}:`, error);
      return { rowId: row.id, budget: [] };
    }
  });

  const budgetResults = await Promise.allSettled(budgetPromises);

  // Create a map of project object ID to budget data
  const budgetMap = new Map<
    string,
    Array<{ year: number; amount: number | null; actual: number | null }>
  >();

  budgetResults.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      budgetMap.set(result.value.rowId, result.value.budget);
    }
  });

  // Attach budget data to project object rows
  const enrichedRows: PlanningTableRow[] = result.map((row: any) => {
    if (row.type === 'projectObject') {
      const budget = budgetMap.get(row.id) || [];
      return {
        ...row,
        budget,
      } as ProjectObjectRow;
    }
    return row as PlanningTableRow;
  });

  return enrichedRows;
}
export const createPlanningRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(planningTableSearchSchema).query(async ({ input }) => {
      return planningTableSearch(input);
    }),
    update: t.procedure.input(planningUpdateSchema).mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!isAdmin(user.role) && !hasPermission(user, 'investmentFinancials.write')) {
        throw new Error('error.insufficientPermissions');
      }

      return await getPool().transaction(async (tx) => {
        await Promise.all(
          Object.entries(input).map(async ([projectObjectId, items]) => {
            if (!items || items.length === 0) return;
            await upsertProjectObject(
              tx,
              {
                projectObjectId,
                budgetUpdate: {
                  budgetItems: items.map((i) => ({
                    year: i.year,
                    amount: i.amount,
                    committee: null,
                  })),
                },
              },
              user.id,
            );
          }),
        );
        return true;
      });
    }),
    years: t.procedure.query(async () => {
      return getWorkTableYearRange();
    }),
  });
