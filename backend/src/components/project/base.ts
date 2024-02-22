import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { FormErrors, fieldError, hasErrors } from '@shared/formerror';
import { UpsertProject, projectIdSchema } from '@shared/schema/project/base';
import { User } from '@shared/schema/user';

import { codeIdFragment } from '../code';

async function upsertBaseProject(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  userId: string,
) {
  const data = {
    project_name: project.projectName,
    description: project.description,
    start_date: project.startDate,
    end_date: project.endDate,
    lifecycle_state: codeIdFragment('HankkeenElinkaarentila', project.lifecycleState),
    owner: project.owner,
    sap_project_id: project.sapProjectId,
    updated_by: userId,
  };

  const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);

  const upsertResult = project.id
    ? await tx.one(sql.type(projectIdSchema)`
      UPDATE app.project
      SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
      WHERE id = ${project.id}
      RETURNING id
    `)
    : await tx.one(sql.type(projectIdSchema)`
      INSERT INTO app.project (${sql.join(identifiers, sql.fragment`,`)})
      VALUES (${sql.join(values, sql.fragment`,`)})
      RETURNING id
    `);

  return upsertResult;
}

export async function getProject(id: string) {
  const project = await getPool().maybeOne(sql.type(
    z.object({
      id: z.string(),
      description: z.string(),
      projectName: z.string(),
      geom: z.string(),
    }),
  )`
    SELECT
      id,
      description,
      project_name AS "projectName",
      ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom
    FROM app.project
    WHERE id = ${id}
      AND deleted = false
  `);
  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }
  return project;
}

export async function deleteProject(id: string, userId: User['id']) {
  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, { eventType: 'deleteProject', eventData: { id }, eventUser: userId });
    const project = await tx.any(sql.type(projectIdSchema)`
      UPDATE app.project SET deleted = true WHERE id = ${id}
    `);
    if (!project) {
      throw new TRPCError({
        code: 'NOT_FOUND',
      });
    }
    const projectObjects = await tx.any(sql.type(projectIdSchema)`
    UPDATE app.project_object SET deleted = true WHERE project_id = ${id} `);

    return { project, projectObjects };
  });
}

export async function validateUpsertProject(
  tx: DatabaseTransactionConnection,
  values: UpsertProject,
) {
  const validationErrors: FormErrors<UpsertProject> = {
    errors: {},
  };

  if (values?.id) {
    const dateRange = await getPool().maybeOne(sql.untyped`
    WITH budget_range AS (
      SELECT
        ${values?.id} as id,
        extract(year FROM ${values?.startDate}::date) <= min(b.year) AS "validBudgetStartDate",
        extract(year FROM ${values?.endDate}::date) >= max(b.year) AS "validBudgetEndDate"
      FROM app.budget b
      WHERE b.project_id = ${values?.id}
      GROUP BY b.project_id
    ), object_range AS (
      SELECT
        ${values?.id} as id,
        min(po.start_date) >= ${values?.startDate} AS "validObjectStartDate",
        max(po.end_date) <= ${values?.endDate} AS "validObjectEndDate"
      FROM app.project_object po
      WHERE po.project_id = ${values?.id}
      GROUP BY po.project_id
    )
    SELECT
      br."validBudgetStartDate",
      br."validBudgetEndDate",
      obr."validObjectStartDate",
      obr."validObjectEndDate"
    FROM object_range obr
	  FULL JOIN budget_range br ON obr.id = br.id;
  `);

    if (dateRange?.validObjectStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('project.error.objectNotIncluded');
    } else if (dateRange?.validBudgetStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('project.error.budgetNotIncluded');
    }

    if (dateRange?.validObjectEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('project.error.objectNotIncluded');
    } else if (dateRange?.validBudgetEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('project.error.budgetNotIncluded');
    }
  }

  // Check that project start date is not after end date
  if (values.startDate >= values.endDate) {
    validationErrors.errors['startDate'] = fieldError('project.error.endDateBeforeStartDate');
    validationErrors.errors['endDate'] = fieldError('project.error.endDateBeforeStartDate');
  }

  // Check that SAP project ID is not changed if project has project objects
  // with selected SAP WBS elements
  if (values?.id) {
    const result = await tx.maybeOne(sql.untyped`
      SELECT
        project.id AS "projectId",
        sap_project.sap_project_id AS "sapProjectId",
        jsonb_agg(project_object.sap_wbs_id) FILTER (WHERE sap_wbs_id IS NOT NULL) AS "projectObjectWBSIds"
      FROM app.project
      LEFT JOIN app.sap_project ON project.sap_project_id = sap_project.sap_project_id
      LEFT JOIN app.project_object ON project.id = project_object.project_id
      WHERE project.id = ${values?.id}
      GROUP BY project.id, sap_project.sap_project_id;
    `);

    if (
      result?.sapProjectId &&
      result?.sapProjectId !== values?.sapProjectId &&
      result?.projectObjectWBSIds?.length > 0
    ) {
      validationErrors.errors['sapProjectId'] = fieldError(
        'project.error.existingProjectObjectWBS',
      );
    }
  }

  return validationErrors;
}

export async function baseProjectUpsert(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  user: User,
) {
  if (hasErrors(await validateUpsertProject(tx, project))) {
    logger.error('Invalid project data', { input: project });
    throw new Error('Invalid project data');
  }
  const result = await upsertBaseProject(tx, project, user.id);
  return result.id;
}
