import { Workbook } from 'excel4node';
import { z } from 'zod';

import {
  getFilterFragment,
  maintenanceProjectFragment,
  textToSearchTerms,
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
      ts_rank(
        COALESCE(project.tsv, ''),
        to_tsquery('simple', ${textToSearchTerms(searchParams.text)})
      ) AS tsrank
    FROM app.project_maintenance
    INNER JOIN app.project ON (project_maintenance.id = project.id AND project.deleted IS FALSE)
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
});

export async function buildMaintenanceProjectReportSheet(
  workbook: Workbook,
  searchParams: ProjectSearch,
) {
  const reportQuery = sql.type(reportRowSchema)`
    WITH projects AS (
      ${projectReportFragment(searchParams)}
      WHERE ${getFilterFragment(searchParams)}
    ), maintenance_projects AS (
      ${maintenanceProjectFragment(searchParams)}
    ), filtered_projects AS (
      SELECT * FROM maintenance_projects
      INNER JOIN projects ON projects."projectId" = maintenance_projects.id
    )
    SELECT
      fp.*,
      "projectCommittee"
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
    WHERE tsrank IS NULL OR tsrank > 0
    ORDER BY tsrank DESC, "projectStartDate" DESC
  `;

  const reportResult = await getPool().any(reportQuery);
  logger.debug(`Fetched ${reportResult.length} rows for the maintenance project report`);
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
    sheetTitle: translations['fi']['report.maintenanceProjects'],
    rows,
    headers,
  });
}
