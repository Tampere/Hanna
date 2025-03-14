import { TRPCError } from '@trpc/server';
import { FragmentSqlToken } from 'slonik';

import { textToTsSearchTerms } from '@backend/components/project/search.js';
import {
  getProjectObjects,
  upsertProjectObject,
} from '@backend/components/projectObject/investment.js';
import { startWorkTableReportJob } from '@backend/components/taskQueue/workTableReportQueue.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';
import { TRPC } from '@backend/router/index.js';

import { UpsertInvestmentProjectObject } from '@shared/schema/projectObject/investment.js';
import { User } from '@shared/schema/user.js';
import { hasPermission, hasWritePermission, ownsProject } from '@shared/schema/userPermissions.js';
import {
  ReportTemplate,
  WorkTableColumn,
  WorkTableSearch,
  WorkTableUpdate,
  projectObjectYears,
  templateColumns,
  workTableRowSchema,
  workTableSearchSchema,
  workTableUpdateSchema,
} from '@shared/schema/workTable.js';

function getWorkTableSearchSelectFragment(reportTemplate: ReportTemplate = 'print') {
  const columnMappings: Record<WorkTableColumn, FragmentSqlToken> = {
    objectName: sql.fragment`object_name AS "objectName"`,
    lifecycleState: sql.fragment`(search_results.lifecycle_state).id AS "lifecycleState"`,
    objectDateRange: sql.fragment`jsonb_build_object(
        'startDate', start_date,
        'endDate', end_date
    ) AS "objectDateRange"`,
    projectDateRange: sql.fragment`jsonb_build_object(
        'startDate', project_start_date,
        'endDate', project_end_date
    ) AS "projectDateRange"`,
    projectLink: sql.fragment`jsonb_build_object(
        'projectId', project_id,
        'projectName', project_name,
        'projectIndex', "projectIndex"
    ) AS "projectLink"`,
    objectType: sql.fragment`(SELECT array_agg((object_type).id) FROM app.project_object_type WHERE search_results.id = project_object_type.project_object_id) AS "objectType"`,
    objectCategory: sql.fragment`(SELECT array_agg((object_category).id) FROM app.project_object_category WHERE search_results.id = project_object_category.project_object_id) AS "objectCategory"`,
    objectUsage: sql.fragment`(SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE search_results.id = project_object_usage.project_object_id) AS "objectUsage"`,
    operatives: sql.fragment`jsonb_build_object(
        'rakennuttajaUser', (
          SELECT ("objectUserRoles"->>'userIds')::json->>0 -- Only one user can be assigned to this role, enforced only at frontend
          FROM po_roles
          WHERE "objectUserRoles"->>'roleId' = '01'
            AND "objectUserRoles"->>'roleType' = 'InvestointiKohdeKayttajaRooli'
            AND po_roles.project_object_id = search_results.id
          ),
        'suunnitteluttajaUser', (
          SELECT ("objectUserRoles"->>'userIds')::json->>0 -- Only one user can be assigned to this role, enforced only at frontend
          FROM po_roles
          WHERE "objectUserRoles"->>'roleId' = '02'
            AND "objectUserRoles"->>'roleType' = 'InvestointiKohdeKayttajaRooli'
            AND po_roles.project_object_id = search_results.id
        )
    ) AS "operatives"`,
    actual: sql.fragment`po_actual.total AS "actual"`,
    amount: sql.fragment`po_budget.amount AS "amount"`,
    forecast: sql.fragment`po_budget.forecast AS "forecast"`,
    kayttosuunnitelmanMuutos: sql.fragment`po_budget.kayttosuunnitelman_muutos AS "kayttosuunnitelmanMuutos"`,
    sapProjectId: sql.fragment`search_results.sap_project_id AS "sapProjectId"`,
    committee: sql.fragment`(SELECT jsonb_agg((committee_type).id)->>0 FROM app.project_object_committee WHERE project_object_id = search_results.id) AS "committee"`,
    budgetYear: sql.fragment``,
    sapWbsId: sql.fragment`search_results.sap_wbs_id AS "sapWbsId"`,
    companyContacts: sql.fragment`
      COALESCE
      (
        (
        SELECT array_agg(po_roles."objectUserRoles")
        FROM po_roles
        WHERE po_roles."objectUserRoles"->>'roleId' = '06'
          AND po_roles.project_object_id = search_results.id
          AND po_roles."objectUserRoles"->>'roleType' = 'KohdeKayttajaRooli'
        ), '{}'::json[]
      ) AS "companyContacts"`,
    objectRoles: sql.fragment`
      COALESCE
      (
        (
        SELECT array_agg(po_roles."objectUserRoles")
        FROM po_roles
        WHERE po_roles.project_object_id = search_results.id
          AND po_roles."objectUserRoles"->>'roleType' = 'KohdeKayttajaRooli'
        ), '{}'::json[]
      ) AS "objectRoles"`,
  };

  return sql.fragment`
  ${sql.join(
    templateColumns[reportTemplate].map((column) => columnMappings[column]),
    sql.fragment`, `,
  )},
  search_results.id AS "id",
  (SELECT jsonb_build_object(
    'writeUsers', (SELECT array_agg(user_id) FROM app.project_permission WHERE project_id = search_results.project_id AND can_write = true),
    'owner', (SELECT owner FROM app.project WHERE id = search_results.project_id)
  )
) AS "permissionCtx"`;
}

export async function workTableSearch(input: WorkTableSearch) {
  const objectNameSearch = textToTsSearchTerms(input.projectObjectName, { minTermLength: 3 });
  const projectNameSearch = textToTsSearchTerms(input.projectName, { minTermLength: 3 });
  const objectNameSubstringSearch =
    input.projectObjectName && input.projectObjectName?.length >= 3 ? input.projectObjectName : '';
  const projectNameSubstringSearch =
    input.projectName && input.projectName?.length >= 3 ? input.projectName : '';

  const {
    objectStartDate = null,
    objectEndDate = null,
    objectType = [],
    objectCategory = [],
    objectUsage = [],
    lifecycleState = [],
    objectStage = [],
    objectParticipantUser = null,
    rakennuttajaUsers = [],
    suunnitteluttajaUsers = [],
    company = [],
    committee = [],
    projectTarget = [],
  } = input;

  const query = sql.type(workTableRowSchema)`
  WITH search_results AS (
    SELECT
      project_object.*,
      poi.object_stage,
      project.id AS "projectId",
      project.project_name,
      dense_rank() OVER (ORDER BY project.project_name)::int4 AS "projectIndex",
      project.sap_project_id,
      project.start_date AS project_start_date,
      project.end_date AS project_end_date
    FROM app.project_object
    LEFT JOIN app.project_object_investment poi ON project_object.id = poi.project_object_id
    INNER JOIN app.project ON project.id = project_object.project_id
    INNER JOIN app.project_investment pi ON pi.id = project.id
    LEFT JOIN app.project_object_user_role pour ON project_object.id = pour.project_object_id

    WHERE project_object.deleted = false
      -- search date range intersection
      AND daterange(${objectStartDate}, ${objectEndDate}, '[]') && daterange(project_object.start_date, project_object.end_date, '[]')
      AND (${objectNameSearch}::text IS NULL OR to_tsquery('simple', ${objectNameSearch}) @@ to_tsvector('simple', project_object.object_name) OR project_object.object_name LIKE '%' || ${objectNameSubstringSearch} || '%')
      AND (${projectNameSearch}::text IS NULL OR to_tsquery('simple', ${projectNameSearch}) @@ to_tsvector('simple', project.project_name) OR  project.project_name LIKE '%' || ${projectNameSubstringSearch} || '%')
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
      AND (
        ${sql.array(objectStage, 'text')} = '{}'::TEXT[] OR
        (poi.object_stage).id = ANY(${sql.array(objectStage, 'text')})
      )
       AND (
        ${sql.array(rakennuttajaUsers, 'text')} = '{}'::TEXT[] OR
        (pour.role = ('InvestointiKohdeKayttajaRooli', '01')::app.code_id AND pour.user_id = ANY(${sql.array(
          rakennuttajaUsers,
          'text',
        )}))

      )
      AND (
        ${sql.array(suunnitteluttajaUsers, 'text')} = '{}'::TEXT[] OR
        (pour.role = ('InvestointiKohdeKayttajaRooli', '02')::app.code_id AND pour.user_id = ANY(${sql.array(
          suunnitteluttajaUsers,
          'text',
        )}))
      )
      AND (
        ${sql.array(company, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg(business_id) FROM app.project_object_user_role pour LEFT JOIN app.company_contact cc ON pour.company_contact_id = cc.id WHERE project_object.id = pour.project_object_id) &&
        ${sql.array(company, 'text')}
      )
      AND (
        ${sql.array(committee, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((committee_type).id) FROM app.project_object_committee WHERE project_object_id = project_object.id) &&
        ${sql.array(committee, 'text')}
      )
      AND (
        ${sql.array(projectTarget, 'text')} = '{}'::TEXT[] OR
        (pi.target).id = ANY(${sql.array(projectTarget, 'text')})
      )
    GROUP BY project_object.id, poi.project_object_id, project.id
    ${
      objectParticipantUser
        ? sql.fragment`HAVING ${objectParticipantUser} = ANY(array_agg(pour.user_id))`
        : sql.fragment``
    }
  ), po_budget AS (
    SELECT
      project_object_id,
      (committee).id AS committee,
      COALESCE(SUM(budget.amount), null) AS amount,
      COALESCE(SUM(budget.forecast), null) AS forecast,
      COALESCE(SUM(budget.kayttosuunnitelman_muutos), null) AS kayttosuunnitelman_muutos
    FROM app.budget
    ${
      objectStartDate
        ? sql.fragment`WHERE year BETWEEN EXTRACT('year' FROM CAST(${objectStartDate} as date)) AND EXTRACT('year' FROM CAST(${objectEndDate} as date))`
        : sql.fragment``
    }
    GROUP BY project_object_id, committee
  ), po_actual AS (
    SELECT
      project_object.id AS po_id,
      SUM(value_in_currency_subunit) AS total
    FROM app.sap_actuals_item
    INNER JOIN app.project_object ON project_object.sap_wbs_id = sap_actuals_item.wbs_element_id
    WHERE fiscal_year BETWEEN EXTRACT('year' FROM CAST(${objectStartDate} as date)) AND EXTRACT('year' FROM CAST(${objectEndDate} as date))
    GROUP BY project_object.id
  ), po_roles AS (
    SELECT
    project_object_id,
    json_build_object(
          'roleId', (role).id,
          'roleType', (role).code_list_id,
          'userIds', COALESCE(json_agg(user_id) FILTER (WHERE user_id IS NOT NULL), '[]'),
          'companyContactIds', COALESCE(json_agg(company_contact_id) FILTER (WHERE company_contact_id IS NOT NULL), '[]')
        )  AS "objectUserRoles"
      FROM app.project_object_user_role, search_results
      WHERE search_results.id = project_object_user_role.project_object_id
	    GROUP BY (role).code_list_id, (role).id, search_results.id, project_object_id
  )
  SELECT
    ${getWorkTableSearchSelectFragment(input.reportTemplate)}
  FROM search_results
  LEFT JOIN po_budget ON po_budget.project_object_id = search_results.id
  LEFT JOIN po_actual ON po_actual.po_id = search_results.id
  ORDER BY project_name ASC, object_name ASC
  `;

  return getPool().any(query);
}

async function workTableUpdate(input: WorkTableUpdate, user: User) {
  const updates = Object.entries(input).map(([projectObjectId, projectObject]) => {
    const {
      budgetYear,
      amount,
      forecast,
      kayttosuunnitelmanMuutos,
      committee,
      operatives,
      ...poUpdate
    } = projectObject;
    return {
      ...poUpdate,
      committee,
      startDate: projectObject.objectDateRange?.startDate,
      endDate: projectObject.objectDateRange?.endDate,
      ...(operatives && {
        objectUserRoles: [
          ...(operatives.rakennuttajaUser
            ? [
                {
                  roleType: 'InvestointiKohdeKayttajaRooli',
                  roleId: '01',
                  userIds: [operatives.rakennuttajaUser],
                  companyContactIds: [],
                },
              ]
            : []),
          ...(operatives.suunnitteluttajaUser
            ? [
                {
                  roleType: 'InvestointiKohdeKayttajaRooli',
                  roleId: '02',
                  userIds: [operatives.suunnitteluttajaUser],
                  companyContactIds: [],
                },
              ]
            : []),
        ],
      }),
      projectObjectId,
      ...(budgetYear && {
        budgetUpdate: {
          budgetItems: [
            {
              year: budgetYear,
              amount: amount,
              forecast,
              kayttosuunnitelmanMuutos,
              committee,
            },
          ],
        },
      }),
    } as UpsertInvestmentProjectObject;
  });

  return await getPool().transaction(async (tx) => {
    await Promise.all(updates.map((update) => upsertProjectObject(tx, update, user.id)));
    return getProjectObjects(tx, Object.keys(input));
  });
}

async function getWorkTableYearRange() {
  const data = await getPool().any(sql.type(projectObjectYears)`
  WITH date_range AS (
    SELECT
      MIN(EXTRACT('year' from start_date)) AS min_year,
      MAX(EXTRACT('year' FROM end_date)) AS max_year
    FROM app.project_object po
    INNER JOIN app.project_object_investment poi ON po.id = poi.project_object_id
    WHERE deleted = false
  )
  SELECT generate_series(min_year::int, max_year::int) AS year
  FROM date_range
  ORDER BY year DESC;
  `);
  return data.map((obj) => Number(obj.year));
}

export const createWorkTableRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(workTableSearchSchema).query(async ({ input }) => {
      return workTableSearch(input);
    }),
    update: t.procedure.input(workTableUpdateSchema).mutation(async ({ ctx, input }) => {
      const conn = getPool();
      const user = ctx.user;
      const ids = Object.keys(input);
      const projectObjects = await getProjectObjects(conn, ids);
      if (user.role !== 'Hanna.Admin') {
        projectObjects
          .map((po) => ({ ctx: po.permissionCtx, projectObjectId: po.projectObjectId }))
          .forEach(({ ctx, projectObjectId }) => {
            if (!ownsProject(user, ctx) && !hasWritePermission(user, ctx)) {
              const containsNonInvestmentFinancialField = Object.keys(input[projectObjectId]).some(
                (key) => !['budgetYear', 'amount', 'kayttosuunnitelmanMuutos'].includes(key),
              );
              if (
                !hasPermission(user, 'investmentFinancials.write') ||
                (hasPermission(user, 'investmentFinancials.write') &&
                  containsNonInvestmentFinancialField)
              ) {
                throw new TRPCError({
                  code: 'BAD_REQUEST',
                  message: 'error.insufficientPermissions',
                });
              }
            }
          });
      }
      return workTableUpdate(input, user);
    }),
    years: t.procedure.query(async () => {
      return getWorkTableYearRange();
    }),
    startWorkTableReportJob: t.procedure.input(workTableSearchSchema).query(async ({ input }) => {
      logger.warn('starting worktable job');
      return startWorkTableReportJob(input);
    }),
  });
