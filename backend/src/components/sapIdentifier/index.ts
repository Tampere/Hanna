import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { codeIdFragment } from '@backend/components/code/index.js';
import { getUserContact } from '@backend/components/mail/userContact.js';
import { validateUpsertProject } from '@backend/components/project/base.js';
import { validateUpsertProjectObject } from '@backend/components/projectObject/index.js';
import { getSapProject, sapProjectExists } from '@backend/components/sap/dataImport.js';
import { startSendMailJob } from '@backend/components/taskQueue/mailQueue.js';
import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';
import { logger } from '@backend/logging.js';

import { FormErrors, hasErrors } from '@shared/formerror.js';
import { UpsertProject } from '@shared/schema/project/base.js';
import {
  ProjectObjectSapIdentifierRequest,
  ProjectSapIdentifierRequest,
  SapIdentifierFinanceView,
  SapIdentifierRequestData,
  SapIdentifierStatus,
  SapIdentifierTarget,
  SetSapIdentifierResult,
  costCenterOptionSchema,
  sapIdentifierFinanceViewSchema,
  sapIdentifierRequestDefaultsSchema,
} from '@shared/schema/sapIdentifierRequest.js';
import { User } from '@shared/schema/user.js';

import { getSapIdentifierRequestFields } from './mailFields.js';

const projectTypeFragment = sql.fragment`
  CASE WHEN EXISTS (SELECT 1 FROM app.project_investment pi WHERE pi.id = project.id)
    THEN 'investmentProject' ELSE 'maintenanceProject' END
`;

const projectPathSegment = {
  investmentProject: 'investointihanke',
  maintenanceProject: 'kunnossapitohanke',
} as const;

export function getHannaUrl(
  projectType: SapIdentifierFinanceView['projectType'],
  target: SapIdentifierTarget,
) {
  const base = `${env.appUrl}/${projectPathSegment[projectType]}/${target.projectId}`;
  return target.projectObjectId ? `${base}/kohde/${target.projectObjectId}` : base;
}

export function getFinanceUrl(target: SapIdentifierTarget) {
  const base = `${env.appUrl}/talous/sap-tunnus/${target.projectId}`;
  return target.projectObjectId ? `${base}/kohde/${target.projectObjectId}` : base;
}

function badRequest(message: string): never {
  throw new TRPCError({ code: 'BAD_REQUEST', message });
}

/**
 * Same validation as the normal forms. The first error's translation key is used as the
 * message so the dialog can show it.
 */
export function assertValid<T>(validation: FormErrors<T>) {
  if (!hasErrors(validation)) return;
  const first = Object.values<{ message?: string } | undefined>(
    (validation?.errors ?? {}) as Record<string, { message?: string } | undefined>,
  ).find((error) => error?.message);
  badRequest(first?.message ?? 'error.invalidInput');
}

/**
 * Status of the identifier and any open request, plus the data shown on the finance page.
 * Throws NOT_FOUND if the target does not exist or the kohde is not under the given hanke.
 */
export async function getFinanceView(
  target: SapIdentifierTarget,
  conn: Pick<DatabaseTransactionConnection, 'maybeOne'> = getPool(),
): Promise<SapIdentifierFinanceView> {
  const { projectId, projectObjectId } = target;
  const row = await conn.maybeOne(sql.type(sapIdentifierFinanceViewSchema)`
    SELECT
      ${
        projectObjectId
          ? sql.fragment`project_object.object_name`
          : sql.fragment`project.project_name`
      } AS title,
      ${Boolean(projectObjectId)}::boolean AS "isProjectObject",
      ${projectTypeFragment} AS "projectType",
      ${
        projectObjectId
          ? sql.fragment`project_object.sap_wbs_id`
          : sql.fragment`project.sap_project_id`
      } AS identifier,
      project.sap_project_id AS "parentProjectSapId",
      (
        SELECT jsonb_build_object(
          'id', r.id,
          'requestedBy', jsonb_build_object('id', u.id, 'name', u.name),
          'requestedAt', r.requested_at
        )
        FROM app.sap_identifier_request r
        INNER JOIN app.user u ON u.id = r.requested_by
        WHERE r.project_id = project.id
          AND r.completed_at IS NULL
          AND ${
            projectObjectId
              ? sql.fragment`r.project_object_id = project_object.id`
              : sql.fragment`r.project_object_id IS NULL`
          }
      ) AS "openRequest"
    FROM app.project
    ${
      projectObjectId
        ? sql.fragment`INNER JOIN app.project_object
            ON project_object.project_id = project.id
            AND project_object.id = ${projectObjectId}
            AND project_object.deleted = false`
        : sql.fragment``
    }
    WHERE project.id = ${projectId} AND project.deleted = false
  `);

  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  // jsonb timestamps come back as strings
  return {
    ...row,
    openRequest: row.openRequest
      ? { ...row.openRequest, requestedAt: new Date(row.openRequest.requestedAt) }
      : null,
  };
}

export async function getStatus(target: SapIdentifierTarget): Promise<SapIdentifierStatus> {
  const { identifier, parentProjectSapId, openRequest } = await getFinanceView(target);
  return { identifier, parentProjectSapId, openRequest };
}

async function insertRequest(
  tx: DatabaseTransactionConnection,
  target: SapIdentifierTarget,
  requestData: SapIdentifierRequestData,
  userId: User['id'],
) {
  return tx.one(sql.type(z.object({ id: z.string() }))`
    INSERT INTO app.sap_identifier_request (project_id, project_object_id, request_data, requested_by)
    VALUES (
      ${target.projectId},
      ${target.projectObjectId ?? null},
      ${JSON.stringify(requestData)}::jsonb,
      ${userId}
    )
    RETURNING id
  `);
}

async function sendRequestMail(
  tx: DatabaseTransactionConnection,
  target: SapIdentifierTarget,
  view: SapIdentifierFinanceView,
  requestData: SapIdentifierRequestData,
  user: User,
) {
  if (env.email.financeRecipients.length === 0) {
    logger.warn('EMAIL_FINANCE_RECIPIENTS is empty, SAP identifier request mail not sent');
    return;
  }

  const fields = await getSapIdentifierRequestFields(tx, target, requestData);
  const requestedBy = await getUserContact(user.id, tx);

  await startSendMailJob({
    mail: {
      to: env.email.financeRecipients,
      replyTo: requestedBy.email || undefined,
      template: {
        name: 'sap-code-request',
        parameters: {
          title: view.title,
          isProjectObject: view.isProjectObject,
          requestedBy,
          fields,
          hannaUrl: getHannaUrl(view.projectType, target),
          financeUrl: getFinanceUrl(target),
        },
      },
    },
    userId: user.id,
    projectId: target.projectId,
  });
}

function assertCanRequest(view: SapIdentifierFinanceView) {
  if (view.identifier) {
    badRequest('sapIdentifier.error.alreadySet');
  }
  if (view.openRequest) {
    badRequest('sapIdentifier.error.requestAlreadyOpen');
  }
  if (view.isProjectObject && !view.parentProjectSapId) {
    badRequest('sapIdentifier.error.parentProjectSapIdMissing');
  }
}

export async function requestProjectSapIdentifier(input: ProjectSapIdentifierRequest, user: User) {
  const target = { projectId: input.projectId };

  return getPool().transaction(async (tx) => {
    const view = await getFinanceView(target, tx);
    assertCanRequest(view);

    // Dates are written to the project itself
    assertValid(
      await validateUpsertProject(tx, {
        projectId: input.projectId,
        startDate: input.startDate,
        endDate: input.endDate,
        sapProjectId: view.identifier,
      } as UpsertProject),
    );

    await addAuditEvent(tx, {
      eventType: 'sapIdentifier.requestProjectSapId',
      eventData: input,
      eventUser: user.id,
    });

    await tx.query(sql.untyped`
      UPDATE app.project
      SET start_date = ${input.startDate},
          end_date = ${input.endDate},
          updated_by = ${user.id}
      WHERE id = ${input.projectId}
    `);

    const requestData: SapIdentifierRequestData = {
      responsiblePerson: input.responsiblePerson,
      serviceClasses: input.serviceClasses,
      costEstimate: input.costEstimate,
    };
    const request = await insertRequest(tx, target, requestData, user.id);
    await sendRequestMail(tx, target, view, requestData, user);

    return request;
  });
}

export async function requestProjectObjectSapIdentifier(
  input: ProjectObjectSapIdentifierRequest,
  user: User,
) {
  const target = { projectId: input.projectId, projectObjectId: input.projectObjectId };

  return getPool().transaction(async (tx) => {
    const view = await getFinanceView(target, tx);
    assertCanRequest(view);

    const costCenter = await tx.maybeOne(sql.untyped`
      SELECT id FROM app.cost_center WHERE id = ${input.costCenterId} AND deleted = false
    `);
    if (!costCenter) {
      badRequest('sapIdentifier.error.invalidCostCenter');
    }

    // Dates and environmental code are written to the project object itself
    assertValid(
      await validateUpsertProjectObject(tx, {
        projectObjectId: input.projectObjectId,
        startDate: input.startDate,
        endDate: input.endDate,
      } as Parameters<typeof validateUpsertProjectObject>[1]),
    );

    await addAuditEvent(tx, {
      eventType: 'sapIdentifier.requestProjectObjectSapWbsId',
      eventData: input,
      eventUser: user.id,
    });

    await tx.query(sql.untyped`
      UPDATE app.project_object
      SET start_date = ${input.startDate},
          end_date = ${input.endDate},
          reason_for_environmental_investment = ${codeIdFragment(
            'YmpäristönsuojelunSyy',
            input.environmentalInvestmentReason ?? undefined,
          )},
          updated_by = ${user.id}
      WHERE id = ${input.projectObjectId}
    `);

    const requestData: SapIdentifierRequestData = {
      responsiblePerson: input.responsiblePerson,
      costCenterId: input.costCenterId,
      projectObjectClass: input.projectObjectClass,
    };
    const request = await insertRequest(tx, target, requestData, user.id);
    await sendRequestMail(tx, target, view, requestData, user);

    return request;
  });
}

/**
 * Marks the open request of a hanke or kohde completed. Called whenever the identifier gets set,
 * also from the normal project / project object upserts.
 */
export async function completeOpenSapIdentifierRequest(
  tx: DatabaseTransactionConnection,
  target: SapIdentifierTarget,
  userId: User['id'],
) {
  await tx.query(sql.untyped`
    UPDATE app.sap_identifier_request
    SET completed_by = ${userId}, completed_at = now()
    WHERE project_id = ${target.projectId}
      AND completed_at IS NULL
      AND ${
        target.projectObjectId
          ? sql.fragment`project_object_id = ${target.projectObjectId}`
          : sql.fragment`project_object_id IS NULL`
      }
  `);
}

async function lookupWarning(
  check: () => Promise<boolean>,
  notFound: NonNullable<SetSapIdentifierResult['warning']>,
): Promise<SetSapIdentifierResult['warning']> {
  try {
    return (await check()) ? null : notFound;
  } catch (error) {
    logger.warn({ error }, 'SAP lookup failed while setting identifier');
    return 'sapLookupFailed';
  }
}

/** Sets only sap_project_id. Warns, but does not block, when SAP does not know the id. */
export async function setProjectSapId(
  target: { projectId: string },
  identifier: string,
  user: User,
): Promise<SetSapIdentifierResult> {
  const sapProjectId = identifier.trim();

  await getPool().transaction(async (tx) => {
    const current = await tx.maybeOne(sql.type(
      z.object({ sapProjectId: z.string().nullable(), wbsCount: z.number() }),
    )`
      SELECT
        project.sap_project_id AS "sapProjectId",
        (SELECT count(*) FROM app.project_object po
          WHERE po.project_id = project.id AND po.deleted = false AND po.sap_wbs_id IS NOT NULL
        )::int AS "wbsCount"
      FROM app.project
      WHERE id = ${target.projectId} AND deleted = false
    `);
    if (!current) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    // Same rule as in the project form: WBS selections would point to the old SAP project
    if (current.sapProjectId && current.sapProjectId !== sapProjectId && current.wbsCount > 0) {
      badRequest('project.error.existingProjectObjectWBS');
    }

    await addAuditEvent(tx, {
      eventType: 'sapIdentifier.setProjectSapId',
      eventData: { projectId: target.projectId, sapProjectId, previous: current.sapProjectId },
      eventUser: user.id,
    });

    await tx.query(sql.untyped`
      UPDATE app.project
      SET sap_project_id = ${sapProjectId}, updated_by = ${user.id}
      WHERE id = ${target.projectId}
    `);
    await completeOpenSapIdentifierRequest(tx, target, user.id);
  });

  const warning = await lookupWarning(() => sapProjectExists(sapProjectId), 'sapProjectNotFound');
  return { identifier: sapProjectId, warning };
}

/** Sets only sap_wbs_id. Warns, but does not block, when the WBS is not under the SAP project. */
export async function setProjectObjectSapWbsId(
  target: { projectId: string; projectObjectId: string },
  identifier: string,
  user: User,
): Promise<SetSapIdentifierResult> {
  const wbsId = identifier.trim();

  const parentSapProjectId = await getPool().transaction(async (tx) => {
    const view = await getFinanceView(target, tx);
    if (!view.parentProjectSapId) {
      badRequest('sapIdentifier.error.parentProjectSapIdMissing');
    }

    await addAuditEvent(tx, {
      eventType: 'sapIdentifier.setProjectObjectSapWbsId',
      eventData: { ...target, sapWbsId: wbsId, previous: view.identifier },
      eventUser: user.id,
    });

    await tx.query(sql.untyped`
      UPDATE app.project_object
      SET sap_wbs_id = ${wbsId}, updated_by = ${user.id}
      WHERE id = ${target.projectObjectId}
    `);
    await completeOpenSapIdentifierRequest(tx, target, user.id);

    return view.parentProjectSapId;
  });

  const warning = await lookupWarning(async () => {
    const sapProject = await getSapProject(parentSapProjectId);
    return Boolean(sapProject?.wbs.some((wbs) => wbs.wbsId === wbsId));
  }, 'sapWbsNotFound');
  return { identifier: wbsId, warning };
}

/** ISO date text; 'infinity' for ongoing maintenance end dates, like in the forms. */
/** ISO date text, keeping 'infinity' (ongoing maintenance) as is. */
export const dateText = (column: ReturnType<typeof sql.fragment>) =>
  sql.fragment`CASE WHEN isfinite(${column}) THEN to_char(${column}, 'YYYY-MM-DD') ELSE ${column}::text END`;

/** Current values of the hanke/kohde used to prefill the request dialog. */
export async function getRequestDefaults(target: SapIdentifierTarget) {
  const { projectId, projectObjectId } = target;
  const row = await getPool().maybeOne(sql.type(sapIdentifierRequestDefaultsSchema)`
    SELECT
      ${
        projectObjectId
          ? sql.fragment`project_object.object_name`
          : sql.fragment`project.project_name`
      } AS title,
      ${projectTypeFragment} AS "projectType",
      ${dateText(
        projectObjectId
          ? sql.fragment`project_object.start_date`
          : sql.fragment`project.start_date`,
      )} AS "startDate",
      ${dateText(
        projectObjectId ? sql.fragment`project_object.end_date` : sql.fragment`project.end_date`,
      )} AS "endDate",
      ${
        projectObjectId
          ? sql.fragment`(project_object.reason_for_environmental_investment).id`
          : sql.fragment`NULL`
      } AS "environmentalInvestmentReason",
      ${
        projectObjectId
          ? // Kohteen luokka from kohdetyyppi: Uudisrakentaminen (02) -> Laajennus (30),
            // anything else (also no type, e.g. maintenance) -> Korvaus (10)
            sql.fragment`CASE WHEN EXISTS (
                SELECT 1 FROM app.project_object_type
                WHERE project_object_type.project_object_id = project_object.id
                  AND (project_object_type.object_type).id = '02'
              ) THEN '30' ELSE '10' END`
          : sql.fragment`NULL`
      } AS "projectObjectClass"
    FROM app.project
    ${
      projectObjectId
        ? sql.fragment`INNER JOIN app.project_object
            ON project_object.project_id = project.id AND project_object.id = ${projectObjectId}`
        : sql.fragment``
    }
    WHERE project.id = ${projectId} AND project.deleted = false
  `);
  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return row;
}

export async function getCostCenters() {
  return getPool().any(sql.type(costCenterOptionSchema)`
    SELECT id, name FROM app.cost_center WHERE deleted = false ORDER BY id
  `);
}
