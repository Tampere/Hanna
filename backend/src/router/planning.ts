import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';
import { TRPC } from '@backend/router/index.js';

import {
  PlanningTableSearch,
  planningTableRowSchema,
  planningTableSearchSchema,
} from '@shared/schema/planningTable.js';

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
  const startYear = yearRange?.start ?? currentYear;
  const endYear = yearRange?.end ?? currentYear + 4;

  // Simplified approach: return basic data and let frontend format it
  // This avoids complex dynamic SQL that causes parameter overflow
  const query = sql.untyped`
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
      SELECT DISTINCT po.id, po.object_name, po.project_id
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
      null AS "projectName",
      fpo.object_name AS "projectObjectName",
      fpo.object_name AS "sortName" -- Added this for consistent sorting
    FROM filtered_project_objects fpo

    ORDER BY type, "sortName"
  `;

  return getPool().any(query);
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
