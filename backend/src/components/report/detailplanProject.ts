import { Workbook } from 'excel4node';
import { z } from 'zod';

import { getFilterFragment } from '@backend/components/project/search';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { translations } from '@shared/language';
import { dateStringSchema } from '@shared/schema/common';
import { ProjectSearch } from '@shared/schema/project';

import { buildSheet } from '.';

const projectReportFragment = sql.fragment`
  SELECT
    project.project_name AS "detailplanProjectName",
    project_detailplan.detailplan_id AS "detailplanProjectDetailplanId",
    (SELECT text_fi FROM app.code WHERE id = project_detailplan.subtype) AS "detailplanProjectSubtype",
    project_detailplan.diary_id AS "detailplanProjectDiaryId",
    (SELECT name FROM app.user WHERE id = project_detailplan.preparer) AS "detailplanProjectPreparer",
    (SELECT name FROM app.user WHERE id = project_detailplan.technical_planner) AS "detailplanProjectTechnicalPlanner",
    project_detailplan.district AS "detailplanProjectDistrict",
    project_detailplan.block_name AS "detailplanProjectBlockName",
    project_detailplan.address_text AS "detailplanProjectAddressText",
    project_detailplan.initiative_date AS "detailplanProjectInitiativeDate"
  FROM app.project_detailplan
  INNER JOIN app.project ON (project_detailplan.id = project.id AND project.deleted IS FALSE)
`;

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
    ${projectReportFragment}
    ${getFilterFragment(searchParams)}
  `;

  const reportResult = await getPool().any(reportQuery);
  logger.debug(`Fetched ${reportResult.length} rows for the detailplan catalog`);
  const rows = z.array(reportRowSchema).parse(reportResult);

  buildSheet({
    workbook,
    sheetTitle: translations['fi']['report.detailplanCatalog'],
    rows,
  });
}
