import { Workbook } from 'excel4node';
import { z } from 'zod';

import {
  detailplanProjectFragment,
  getFilterFragment,
  textToTsSearchTerms,
} from '@backend/components/project/search.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { TranslationKey, translations } from '@shared/language/index.js';
import { dateStringSchema } from '@shared/schema/common.js';
import { ProjectSearch } from '@shared/schema/project/index.js';
import { Suffix } from '@shared/util-types.js';

import { buildSheet } from './index.js';

type ReportColumnKey = Partial<Suffix<TranslationKey, 'report.columns.'>>;

function projectReportFragment(searchParams: ProjectSearch) {
  return sql.fragment`
    SELECT
      project.project_name AS "detailplanProjectName",
      project.id AS "projectId",
      project_detailplan.detailplan_id AS "detailplanProjectDetailplanId",
      (SELECT text_fi FROM app.code WHERE id = project_detailplan.subtype) AS "detailplanProjectSubtype",
      project_detailplan.diary_id AS "detailplanProjectDiaryId",
      (SELECT name FROM app.user WHERE id = project_detailplan.preparer) AS "detailplanProjectPreparer",
      (SELECT name FROM app.user WHERE id = project_detailplan.technical_planner) AS "detailplanProjectTechnicalPlanner",
      project_detailplan.district AS "detailplanProjectDistrict",
      project_detailplan.block_name AS "detailplanProjectBlockName",
      project_detailplan.address_text AS "detailplanProjectAddressText",
      project_detailplan.initiative_date AS "detailplanProjectInitiativeDate",
      ts_rank(
        COALESCE(project.tsv, '') || COALESCE(project_detailplan.tsv, ''),
        to_tsquery('simple', ${textToTsSearchTerms(searchParams.text)})
      ) AS tsrank
    FROM app.project_detailplan
    INNER JOIN app.project ON (project_detailplan.id = project.id AND project.deleted IS FALSE)
  `;
}

const reportRowSchema = z.object({
  detailplanProjectDetailplanId: z.number(),
  detailplanProjectSubtype: z.string().nullish(),
  detailplanProjectDiaryId: z.string().nullish(),
  detailplanProjectPreparer: z.string(),
  detailplanProjectTechnicalPlanner: z.string().nullish(),
  detailplanProjectDistrict: z.string(),
  detailplanProjectBlockName: z.string(),
  detailplanProjectAddressText: z.string(),
  detailplanProjectName: z.string(),
  detailplanProjectInitiativeDate: dateStringSchema.nullish(),
});

export async function buildDetailplanCatalogSheet(workbook: Workbook, searchParams: ProjectSearch) {
  const reportQuery = sql.type(reportRowSchema)`
    WITH projects AS (
      ${projectReportFragment(searchParams)}
      WHERE ${getFilterFragment(searchParams)}
    ), detailplan_projects AS (
      ${detailplanProjectFragment(searchParams)}
    ), filtered_projects AS (
      SELECT * FROM detailplan_projects
      INNER JOIN projects ON projects."projectId" = detailplan_projects.id
    )
    SELECT * FROM filtered_projects
    WHERE tsrank IS NULL OR tsrank > 0.01 OR filtered_projects."detailplanProjectName" LIKE '%' || ${
      searchParams?.text ?? ''
    } || '%'
    ORDER BY "detailplanProjectDetailplanId" ASC
  `;

  const reportResult = await getPool().any(reportQuery);
  logger.debug(`Fetched ${reportResult.length} rows for the detailplan catalog`);
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
    sheetTitle: translations['fi']['report.detailplanCatalog'],
    rows,
    headers,
  });
}
