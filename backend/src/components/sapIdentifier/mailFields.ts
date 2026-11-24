import { CommonQueryMethods } from 'slonik';
import { z } from 'zod';

import { MailField, formatEuros } from '@backend/components/mail/templates.js';
import { formatUserContact, getUserContact } from '@backend/components/mail/userContact.js';
import { sql } from '@backend/db.js';

import {
  SapIdentifierRequestData,
  SapIdentifierTarget,
} from '@shared/schema/sapIdentifierRequest.js';

/**
 * Fields shown in the SAP identifier request email. Add, remove or reorder rows here -
 * the template renders whatever is returned.
 */

const codeText = (codeListId: string, id: string) =>
  sql.fragment`(SELECT text_fi FROM app.code WHERE id = (${codeListId}, ${id})::app.code_id)`;

const formatDate = (column: string) => {
  const identifier = sql.identifier(column.split('.'));
  // 'infinity' = ongoing maintenance project/object
  return sql.fragment`CASE WHEN isfinite(${identifier}) THEN to_char(${identifier}, 'DD.MM.YYYY') ELSE 'toistaiseksi' END`;
};

const projectRowSchema = z.object({
  projectName: z.string(),
  projectType: z.string(),
  ownerId: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  serviceClasses: z.array(z.string()),
});

const projectObjectRowSchema = z.object({
  objectName: z.string(),
  projectName: z.string(),
  projectSapId: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  environmentalCode: z.string().nullable(),
  costCenter: z.string().nullable(),
  projectObjectClass: z.string().nullable(),
});

const schedule = (startDate: string | null, endDate: string | null) =>
  startDate || endDate ? `${startDate ?? ''} - ${endDate ?? ''}` : null;

export async function getSapIdentifierRequestFields(
  conn: CommonQueryMethods,
  target: SapIdentifierTarget,
  requestData: SapIdentifierRequestData,
): Promise<MailField[]> {
  if (!target.projectObjectId) {
    const row = await conn.one(sql.type(projectRowSchema)`
      SELECT
        project.project_name AS "projectName",
        CASE WHEN EXISTS (SELECT 1 FROM app.project_investment pi WHERE pi.id = project.id)
          THEN 'Investointihanke' ELSE 'Kunnossapitohanke' END AS "projectType",
        project.owner AS "ownerId",
        ${formatDate('project.start_date')} AS "startDate",
        ${formatDate('project.end_date')} AS "endDate",
        coalesce((
          SELECT array_agg((code.id).id || ' ' || code.text_fi ORDER BY (code.id).id)
          FROM app.code
          WHERE (code.id).code_list_id = 'Palveluluokka'
            AND (code.id).id = ANY(${sql.array(requestData.serviceClasses ?? [], 'text')})
        ), '{}') AS "serviceClasses"
      FROM app.project
      WHERE project.id = ${target.projectId}
    `);
    const owner = await getUserContact(row.ownerId, conn);
    const responsible = requestData.responsiblePerson
      ? formatUserContact(await getUserContact(requestData.responsiblePerson, conn))
      : null;

    return [
      { label: 'Hanke', value: row.projectName },
      { label: 'Hanketyyppi', value: row.projectType },
      { label: 'Vastuuhenkilö', value: responsible },
      { label: 'Hankkeen omistaja', value: owner.name },
      { label: 'Aikataulu', value: schedule(row.startDate, row.endDate) },
      {
        label: 'Kustannusarvio',
        value: requestData.costEstimate != null ? formatEuros(requestData.costEstimate) : null,
      },
      { label: 'Palveluluokat', value: row.serviceClasses.join(', ') || null },
    ];
  }

  const row = await conn.one(sql.type(projectObjectRowSchema)`
    SELECT
      project_object.object_name AS "objectName",
      project.project_name AS "projectName",
      project.sap_project_id AS "projectSapId",
      ${formatDate('project_object.start_date')} AS "startDate",
      ${formatDate('project_object.end_date')} AS "endDate",
      (
        SELECT (code.id).id || ' ' || code.text_fi
        FROM app.code
        WHERE code.id = project_object.reason_for_environmental_investment
      ) AS "environmentalCode",
      (
        SELECT cost_center.id || ' ' || cost_center.name
        FROM app.cost_center
        WHERE cost_center.id = ${requestData.costCenterId ?? null}
      ) AS "costCenter",
      ${
        requestData.projectObjectClass
          ? codeText('Hankeluokka', requestData.projectObjectClass)
          : sql.fragment`NULL`
      } AS "projectObjectClass"
    FROM app.project_object
    INNER JOIN app.project ON project.id = project_object.project_id
    WHERE project_object.id = ${target.projectObjectId}
  `);
  const responsible = requestData.responsiblePerson
    ? formatUserContact(await getUserContact(requestData.responsiblePerson, conn))
    : null;

  return [
    { label: 'Kohde', value: row.objectName },
    { label: 'Hanke', value: row.projectName },
    { label: 'Hankkeen SAP-projekti', value: row.projectSapId },
    { label: 'Vastuuhenkilö', value: responsible },
    { label: 'Kustannuspaikka', value: row.costCenter },
    {
      label: 'Kohteen luokka',
      value: row.projectObjectClass
        ? `${requestData.projectObjectClass} ${row.projectObjectClass}`
        : null,
    },
    { label: 'Ympäristökoodi', value: row.environmentalCode },
    { label: 'Aikataulu', value: schedule(row.startDate, row.endDate) },
    ...(requestData.estimates ?? []).map(({ year, estimate }) => ({
      label: `Talousarvioennuste ${year}`,
      value: estimate != null ? formatEuros(estimate) : null,
    })),
  ];
}
