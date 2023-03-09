import { Workbook } from 'excel4node';
import { z } from 'zod';

import { getFilterFragment } from '@backend/components/project';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { translations } from '@shared/language';
import { ProjectSearch } from '@shared/schema/project';

const dateStringSchema = z.string().transform((value) => new Date(value));
const datetimeSchema = z.number().transform((value) => new Date(value));

const projectReportFragment = sql.fragment`
  SELECT
    project.project_name AS "projectName",
    project.id AS "projectId",
    project.description AS "projectDescription",
    project.created_at AS "projectCreatedAt",
    project_common.start_date AS "projectStartDate",
    project_common.end_date AS "projectEndDate",
    (SELECT text_fi FROM app.code WHERE id = project_common.lifecycle_state) AS "projectLifecycleState",
    (SELECT text_fi FROM app.code WHERE id = project_common.project_type) AS "projectType",
    project.sap_project_id AS "projectSAPProjectId",
    (SELECT email FROM app.user WHERE id = project.owner) AS "projectOwnerEmail",
    (SELECT email FROM app.user WHERE id = project_common.person_in_charge) AS "projectPersonInChargeEmail",
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
    project_object.sap_wbs_id AS "projectObjectSAPWBSId"
  FROM app.project_common
  INNER JOIN app.project ON (project_common.id = project.id AND project.deleted IS FALSE)
  LEFT JOIN app.project_object ON (project.id = project_object.project_id AND project_object.deleted IS FALSE)
`;

const reportRowSchema = z.object({
  projectName: z.string(),
  projectId: z.string(),
  projectDescription: z.string(),
  projectCreatedAt: datetimeSchema,
  projectStartDate: dateStringSchema,
  projectEndDate: dateStringSchema,
  projectLifecycleState: z.string(),
  projectType: z.string(),
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

type ReportRow = z.infer<typeof reportRowSchema>;

async function dbResultToXlsx(rows: ReportRow[]) {
  const reportFields = Object.keys(rows[0]) as (keyof ReportRow)[];
  const headers = reportFields.map((field) => translations['fi'][`report.columns.${field}`]);

  const workbook = new Workbook({
    dateFormat: 'd.m.yyyy',
  });
  const worksheet = workbook.addWorksheet('Raportti');
  const headerStyle = workbook.createStyle({
    font: {
      bold: true,
    },
  });

  headers.forEach((header, index) => {
    worksheet
      .cell(1, index + 1)
      .string(header)
      .style(headerStyle);
  });

  rows.forEach((row, rowIndex) => {
    Object.values(row).forEach((value, column) => {
      // Skip empty values
      if (value == null) {
        return;
      }

      const cell = worksheet.cell(rowIndex + 2, column + 1);
      if (value instanceof Date) {
        cell.date(value);
      } else {
        cell.string(value);
      }
    });
  });

  return await workbook.writeToBuffer();
}
export async function buildProjectReport(jobId: string, data: ProjectSearch) {
  const reportQuery = sql.type(reportRowSchema)`
    ${projectReportFragment}
    ${getFilterFragment(data)}
  `;

  try {
    logger.debug(`Running report query for job ${jobId} with data: ${JSON.stringify(data)}`);
    const reportResult = await getPool().any(reportQuery);
    const reportRows = z.array(reportRowSchema).parse(reportResult);
    const buffer = await dbResultToXlsx(reportRows);
    logger.debug(`Saving report to database, ${buffer.length} bytes...`);
    const queryResult = await getPool().query(sql.untyped`
      INSERT INTO app.report_file (pgboss_job_id, report_filename, report_data)
      VALUES (${jobId}, 'raportti.xlsx', ${sql.binary(buffer)})
    `);
    logger.debug(`Report saved to database, ${queryResult.rowCount} rows affected.`);
  } catch (error) {
    // Log and rethrow the error to make the job state failed
    logger.error(error);
    throw error;
  }
}
