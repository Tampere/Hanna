import xlsx from 'node-xlsx';

import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { ProjectSearch } from '@shared/schema/project';

const projectReportFragment = sql.fragment`
  SELECT
    project.project_name AS "projectName",
    project.id AS "projectId",
    project.description AS "projectDescription",
    project.created_at::date AS "projectCreatedAt",
    project.start_date AS "projectStartDate",
    project.end_date AS "projectEndDate",
    (SELECT text_fi FROM app.code WHERE id = project.lifecycle_state) AS "projectLifecycleState",
    (SELECT text_fi FROM app.code WHERE id = project.project_type) AS "projectType",
    project.sap_project_id AS "projectSAPProjectId",
    (SELECT email FROM app.user WHERE id = project.owner) AS "projectOwnerEmail",
    (SELECT email FROM app.user WHERE id = project.person_in_charge) AS "projectPersonInChargeEmail",
    project_object.id AS "projectObjectId",
    project_object.object_name AS "projectObjectName",
    project_object.description AS "projectObjectDescription",
    (SELECT text_fi FROM app.code WHERE id = project_object.lifecycle_state) AS "projectObjectLifecycleState",
    (SELECT text_fi FROM app.code WHERE id = project_object.object_type) AS "projectObjectType",
    (SELECT text_fi FROM app.code WHERE id = project_object.object_category) AS "projectObjectCategroy",
    (SELECT text_fi FROM app.code WHERE id = project_object.object_usage) AS "projectObjectUsage",
    (SELECT email FROM app.user WHERE id = project_object.person_in_charge) AS "projectObjectPersonInChargeEmail",
    project_object.created_at::date AS "projectObjectCreatedAt",
    project_object.start_date AS "projectObjectStartDate",
    project_object.end_date AS "projectObjectEndDate",
    (SELECT text_fi FROM app.code WHERE id = project_object.landownership) AS "projectObjectLandownership",
    (SELECT text_fi FROM app.code WHERE id = project_object.location_on_property) AS "projectObjectLocationOnProperty",
    project_object.sap_wbs_id AS "projectObjectSAPWBSId"
  FROM app.project
  LEFT JOIN app.project_object ON (project.id = project_object.project_id AND project_object.deleted IS FALSE)
  WHERE project.deleted IS FALSE;
`;

export async function buildProjectReport(jobId: string, data: ProjectSearch) {
  logger.debug('Building project report');
  const buffer = xlsx.build([
    {
      name: 'Raportti',
      options: {},
      data: [
        [1, 2, 3],
        [true, false, null, 'sheetjs'],
        ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'],
        ['baz', null, 'qux'],
      ],
    },
  ]);

  logger.debug(`Saving report to database, ${buffer.length} bytes...`);
  const queryResult = await getPool().query(sql.untyped`
    INSERT INTO app.report_file (pgboss_job_id, report_filename, report_data)
    VALUES (${jobId}, 'TODO.xlsx', ${sql.binary(buffer)})
  `);
  logger.debug(`Report saved to database, ${queryResult.rowCount} rows affected.`);
}
