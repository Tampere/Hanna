import { Workbook } from 'excel4node';
import { z } from 'zod';

import {
  getFilterFragment,
  investmentProjectFragment,
  textToTsSearchTerms,
} from '@backend/components/project/search.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { TranslationKey, translations } from '@shared/language/index.js';
import { dateStringSchema, datetimeSchema } from '@shared/schema/common.js';
import { ProjectSearch } from '@shared/schema/project/index.js';
import { Suffix } from '@shared/util-types.js';

import { buildSheet } from './index.js';

type ReportColumnKey = Partial<Suffix<TranslationKey, 'report.columns.'>>;

function projectReportFragment(searchParams: ProjectSearch) {
  const roleSelectFragment = sql.fragment`
    SELECT email
    FROM app.USER, app.project_object_user_role pour
    WHERE id = pour.user_id AND pour.project_object_id = project_object.id`;

  return sql.fragment`
    SELECT
      project.project_name AS "projectName",
      project.id AS "projectId",
      project.description AS "projectDescription",
      project.created_at AS "projectCreatedAt",
      project.start_date AS "projectStartDate",
      project.end_date AS "projectEndDate",
      (SELECT text_fi FROM app.code WHERE id = project.lifecycle_state) AS "projectLifecycleState",
      project.sap_project_id AS "projectSAPProjectId",
      (SELECT email FROM app.user WHERE id = project.owner) AS "projectOwnerEmail",
      project_object.id AS "projectObjectId",
      project_object.object_name AS "projectObjectName",
      project_object.description AS "projectObjectDescription",
      (SELECT text_fi FROM app.code WHERE id = project_object.lifecycle_state) AS "projectObjectLifecycleState",
      (${roleSelectFragment} AND pour.role = ('InvestointiKohdeKayttajaRooli', '01')::app.code_id) AS "projectObjectRakennuttaja",
      (${roleSelectFragment} AND pour.role = ('InvestointiKohdeKayttajaRooli', '02')::app.code_id) AS "projectObjectSuunnitteluttaja",
      project_object.created_at AS "projectObjectCreatedAt",
      project_object.start_date AS "projectObjectStartDate",
      project_object.end_date AS "projectObjectEndDate",
      (SELECT text_fi FROM app.code WHERE id = project_object.landownership) AS "projectObjectLandownership",
      (SELECT text_fi FROM app.code WHERE id = project_object.location_on_property) AS "projectObjectLocationOnProperty",
      project_object.sap_wbs_id AS "projectObjectSAPWBSId",
      ts_rank(
        COALESCE(project.tsv, ''),
        to_tsquery('simple', ${textToTsSearchTerms(searchParams.text)})
      ) AS tsrank
    FROM app.project_investment
    INNER JOIN app.project ON (project_investment.id = project.id AND project.deleted IS FALSE)
    LEFT JOIN app.project_object ON (project.id = project_object.project_id AND project_object.deleted IS FALSE)
  `;
}

const reportRowSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  projectDescription: z.string(),
  projectCreatedAt: datetimeSchema,
  projectStartDate: dateStringSchema,
  projectEndDate: dateStringSchema,
  projectLifecycleState: z.string(),
  projectCommittee: z.string().nullish(),
  projectSAPProjectId: z.string().nullish(),
  projectOwnerEmail: z.string(),
  projectObjectId: z.string().nullish(),
  projectObjectName: z.string().nullish(),
  projectObjectDescription: z.string().nullish(),
  projectObjectLifecycleState: z.string().nullish(),
  projectObjectType: z.string().nullish(),
  projectObjectCategory: z.string().nullish(),
  projectObjectUsage: z.string().nullish(),
  projectObjectRakennuttaja: z.string().nullish(),
  projectObjectSuunnitteluttaja: z.string().nullish(),
  projectObjectCreatedAt: datetimeSchema.nullish(),
  projectObjectStartDate: dateStringSchema.nullish(),
  projectObjectEndDate: dateStringSchema.nullish(),
  projectObjectLandownership: z.string().nullish(),
  projectObjectLocationOnProperty: z.string().nullish(),
  projectObjectSAPWBSId: z.string().nullish(),
});

export async function buildInvestmentProjectReportSheet(
  workbook: Workbook,
  searchParams: ProjectSearch,
) {
  const reportQuery = sql.type(reportRowSchema)`
    WITH projects AS (
      ${projectReportFragment(searchParams)}
      WHERE ${getFilterFragment(searchParams)}
    ), investment_projects AS (
      ${investmentProjectFragment(searchParams)}
    ), filtered_projects AS (
      SELECT * FROM investment_projects
      INNER JOIN projects ON projects."projectId" = investment_projects.id
    )
    SELECT
      fp.*,
      "projectCommittee",
      "projectObjectType",
      "projectObjectCategory",
      "projectObjectUsage"
    FROM
      filtered_projects fp
      -- Aggregate each multiselect codes into one localized column each
      LEFT JOIN (
        SELECT
          project_id,
          string_agg(c.text_fi, ', ') AS "projectCommittee"
        FROM app.project_committee pc
        LEFT JOIN app.code c ON c.id = pc.committee_type
        GROUP BY project_id
      ) committees ON fp.id = committees.project_id
      LEFT JOIN (
        SELECT
          project_object_id,
          string_agg(c.text_fi, ', ') AS "projectObjectType"
        FROM app.project_object_type pot
        LEFT JOIN app.code c ON c.id = pot.object_type
        GROUP BY project_object_id
      ) object_types ON fp."projectObjectId" = object_types.project_object_id
      LEFT JOIN (
        SELECT
          project_object_id,
          string_agg(c.text_fi, ', ') AS "projectObjectCategory"
        FROM app.project_object_category poc
        LEFT JOIN app.code c ON c.id = poc.object_category
        GROUP BY project_object_id
      ) object_categories ON fp."projectObjectId" = object_categories.project_object_id
      LEFT JOIN (
        SELECT
          project_object_id,
          string_agg(c.text_fi, ', ') AS "projectObjectUsage"
        FROM app.project_object_usage pou
        LEFT JOIN app.code c ON c.id = pou.object_usage
        GROUP BY project_object_id
      ) object_usages ON fp."projectObjectId" = object_usages.project_object_id
    WHERE tsrank IS NULL OR tsrank > 0.01 OR fp."projectName" LIKE '%' || ${
      searchParams?.text ?? ''
    } || '%'
    ORDER BY tsrank DESC, "projectStartDate" DESC
  `;

  const reportResult = await getPool().any(reportQuery);
  logger.debug(`Fetched ${reportResult.length} rows for the investment project report`);
  const rows = z.array(reportRowSchema).parse(reportResult);

  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]).reduce(
    (headers, key) => ({
      ...headers,
      [key]: translations['fi'][`report.columns.${key as ReportColumnKey}`],
    }),
    {} as { [key in ReportColumnKey]: string },
  );

  buildSheet({
    workbook,
    sheetTitle: translations['fi']['report.investmentProjects'],
    rows,
    headers,
  });
}
