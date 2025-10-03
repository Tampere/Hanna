import { z } from 'zod';

import { getProjectObjectBudget } from '@backend/components/projectObject/index.js';
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
} from '@shared/schema/planningTable.js';
import { yearlyActualsSchema } from '@shared/schema/sapActuals.js';

import { getWorkTableYearRange } from './workTable.js';

// Creates a PlanningTable view similar to WorkTable
// Shows projects/project objects as rows with yearly columns (Estimate/Actual)
// Actuals are only shown for past and current years, not future years
async function planningTableSearch(input: PlanningTableSearch) {
  const {
    committee = [],
    // sitovuus
    palmGrouping = [],
    // Omistaja
    // Kohteen laji
    // Kohteen tyyppi
    // Rakennuttaja
    // suunnitteluttaja
    objectStage = [],
    // Omat kohteet
    yearRange = null,
  } = input;

  // Determine the year range to display
  const currentYear = new Date().getFullYear();
  const startYear = input.yearRange?.start; // yearRange?.start ?? currentYear;
  const endYear = input.yearRange?.end; // yearRange?.end ?? currentYear + 4;

  // Simplified approach: return basic data and let frontend format it
  // This avoids complex dynamic SQL that causes parameter overflow
  const query = sql.type(planningTableRowResult)`
    WITH filtered_projects AS (
      SELECT DISTINCT p.id, p.project_name
      FROM app.project p
      INNER JOIN app.project_investment pi ON pi.id = p.id
      WHERE p.deleted = false
        AND (
          ${sql.array(committee, 'text')} = '{}'::TEXT[] OR
          EXISTS (
            SELECT 1 FROM app.project_committee pc
            WHERE pc.project_id = p.id AND (pc.committee_type).id = ANY(${sql.array(
              committee,
              'text',
            )})
          )
        )
        AND (
          ${sql.array(palmGrouping, 'text')} = '{}'::TEXT[] OR
          (pi.palm_grouping).id = ANY(${sql.array(palmGrouping, 'text')})
        )
    ),
    filtered_project_objects AS (
      SELECT DISTINCT po.id, po.object_name, po.project_id, p.project_name
      FROM app.project_object po
      INNER JOIN app.project_object_investment poi ON poi.project_object_id = po.id
      INNER JOIN app.project p ON p.id = po.project_id
      WHERE po.deleted = false
        AND (
          ${sql.array(committee, 'text')} = '{}'::TEXT[] OR
          EXISTS (
            SELECT 1 FROM app.project_object_committee poc
            WHERE poc.project_object_id = po.id AND (poc.committee_type).id = ANY(${sql.array(
              committee,
              'text',
            )})
          )
        )
        AND (
          ${sql.array(palmGrouping, 'text')} = '{}'::TEXT[] OR
          (poi.palm_grouping).id = ANY(${sql.array(palmGrouping, 'text')})
        )
        AND (
          ${sql.array(objectStage, 'text')} = '{}'::TEXT[] OR
          (poi.object_stage).id = ANY(${sql.array(objectStage, 'text')})
        )
    )
    -- Return project rows
    SELECT
      fp.id::text,
      'project' AS type,
      fp.project_name AS "projectName",
      null AS "projectObjectName",
      fp.project_name AS "sortName" -- Added this for consistent sorting
    FROM filtered_projects fp

    UNION ALL

    -- Return project object rows
    SELECT
      fpo.id::text,
      'projectObject' AS type,
      fpo.project_name AS "projectName",
      fpo.object_name AS "projectObjectName",
      fpo.object_name AS "sortName" -- Added this for consistent sorting
    FROM filtered_project_objects fpo

    ORDER BY type, "sortName"
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
    years: t.procedure.query(async () => {
      return getWorkTableYearRange();
    }),
  });
