import { Workbook } from 'excel4node';
import { z } from 'zod';

import {
  getFilterFragment,
  investmentProjectFragment,
  textToSearchTerms,
} from '@backend/components/project/search';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { translations } from '@shared/language';
import { dateStringSchema, datetimeSchema } from '@shared/schema/common';
import { ProjectSearch } from '@shared/schema/project';

import { buildSheet } from '.';

function projectReportFragment(searchParams: ProjectSearch) {
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
      (SELECT email FROM app.user WHERE id = project_investment.person_in_charge) AS "projectPersonInChargeEmail",
      project_object.id AS "projectObjectId",
      project_object.object_name AS "projectObjectName",
      project_object.description AS "projectObjectDescription",
      (SELECT text_fi FROM app.code WHERE id = project_object.lifecycle_state) AS "projectObjectLifecycleState",
      (SELECT text_fi FROM app.code WHERE id = project_object.object_type) AS "projectObjectType",
      (SELECT text_fi FROM app.code WHERE id = project_object.object_category) AS "projectObjectCategory",
      (SELECT text_fi FROM app.code WHERE id = project_object.object_usage) AS "projectObjectUsage",
      (SELECT email FROM app.user WHERE id = project_object.person_in_charge) AS "projectObjectPersonInChargeEmail",
      project_object.created_at AS "projectObjectCreatedAt",
      project_object.start_date AS "projectObjectStartDate",
      project_object.end_date AS "projectObjectEndDate",
      (SELECT text_fi FROM app.code WHERE id = project_object.landownership) AS "projectObjectLandownership",
      (SELECT text_fi FROM app.code WHERE id = project_object.location_on_property) AS "projectObjectLocationOnProperty",
      project_object.sap_wbs_id AS "projectObjectSAPWBSId",
      ts_rank(
        COALESCE(project.tsv, ''),
        to_tsquery('simple', ${textToSearchTerms(searchParams.text)})
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
  projectSAPProjectId: z.string().nullish(),
  projectOwnerEmail: z.string(),
  projectPersonInChargeEmail: z.string(),
  projectObjectId: z.string().nullish(),
  projectObjectName: z.string().nullish(),
  projectObjectDescription: z.string().nullish(),
  projectObjectLifecycleState: z.string().nullish(),
  projectObjectType: z.string().nullish(),
  projectObjectCategory: z.string().nullish(),
  projectObjectUsage: z.string().nullish(),
  projectObjectPersonInChargeEmail: z.string().nullish(),
  projectObjectCreatedAt: datetimeSchema.nullish(),
  projectObjectStartDate: dateStringSchema.nullish(),
  projectObjectEndDate: dateStringSchema.nullish(),
  projectObjectLandownership: z.string().nullish(),
  projectObjectLocationOnProperty: z.string().nullish(),
  projectObjectSAPWBSId: z.string().nullish(),
});

export async function buildInvestmentProjectReportSheet(
  workbook: Workbook,
  searchParams: ProjectSearch
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
    SELECT * FROM filtered_projects
    WHERE tsrank IS NULL OR tsrank > 0
    ORDER BY tsrank DESC, "projectStartDate" DESC
  `;

  const reportResult = await getPool().any(reportQuery);
  logger.debug(`Fetched ${reportResult.length} rows for the investment project report`);
  const rows = z.array(reportRowSchema).parse(reportResult);

  buildSheet({
    workbook,
    sheetTitle: translations['fi']['report.investmentProjects'],
    rows,
  });
}
