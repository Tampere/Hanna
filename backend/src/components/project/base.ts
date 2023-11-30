import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { FormErrors, fieldError, hasErrors } from '@shared/formerror';
import { ProjectPermission, UpsertProject, projectIdSchema } from '@shared/schema/project/base';
import { User } from '@shared/schema/user';
import { ProjectPermissionContext, permissionContextSchema } from '@shared/schema/userPermissions';

import { codeIdFragment } from '../code';

async function upsertBaseProject(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  userId: string
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

  const upsertResult = project.projectId
    ? await tx.one(sql.type(projectIdSchema)`
      UPDATE app.project
      SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
      WHERE id = ${project.projectId}
      RETURNING id AS "projectId"
    `)
    : await tx.one(sql.type(projectIdSchema)`
      INSERT INTO app.project (${sql.join(identifiers, sql.fragment`,`)})
      VALUES (${sql.join(values, sql.fragment`,`)})
      RETURNING id AS "projectId"
    `);

  return upsertResult;
}

export async function getPermissionContext(id: string): Promise<ProjectPermissionContext> {
  const permissionCtx = await getPool().maybeOne(sql.type(permissionContextSchema)`
    SELECT
      id,
      "owner",
      coalesce(array_agg(project_permission.user_id) FILTER (WHERE can_write = true), '{}') AS "writeUsers"
    FROM app.project
    LEFT JOIN app.project_permission ON project.id = project_permission.project_id
    WHERE project.id = ${id}
    GROUP BY id, "owner"
  `);
  if (!permissionCtx) {
    throw new Error('Could not get permission context');
  }
  return permissionCtx;
}

export async function getProject(id: string) {
  const project = await getPool().maybeOne(sql.type(
    z.object({
      projectId: z.string(),
      description: z.string(),
      projectName: z.string(),
      geom: z.string(),
    })
  )`
    SELECT
      id AS "projectId",
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
    return project;
  });
}

export async function validateUpsertProject(
  tx: DatabaseTransactionConnection,
  values: UpsertProject
) {
  const validationErrors: FormErrors<UpsertProject> = { errors: {} };

  if (values?.projectId) {
    const budgetRange = await getPool().maybeOne(sql.untyped`
    SELECT
      extract(year FROM ${values?.startDate}::date) <= min(budget.year) AS "validStartDate",
      extract(year FROM ${values?.endDate}::date) >= max(budget.year) AS "validEndDate"
    FROM app.budget
    WHERE project_id = ${values?.projectId}
    GROUP BY project_id;
  `);

    if (budgetRange?.validStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('project.error.budgetNotIncluded');
    }

    if (budgetRange?.validEndDate === false) {
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
  if (values?.projectId) {
    const result = await tx.maybeOne(sql.untyped`
      SELECT
        project.id AS "projectId",
        sap_project.sap_project_id AS "sapProjectId",
        jsonb_agg(project_object.sap_wbs_id) FILTER (WHERE sap_wbs_id IS NOT NULL) AS "projectObjectWBSIds"
      FROM app.project
      LEFT JOIN app.sap_project ON project.sap_project_id = sap_project.sap_project_id
      LEFT JOIN app.project_object ON project.id = project_object.project_id
      WHERE project.id = ${values?.projectId}
      GROUP BY project.id, sap_project.sap_project_id;
    `);

    if (
      result?.sapProjectId &&
      result?.sapProjectId !== values?.sapProjectId &&
      result?.projectObjectWBSIds?.length > 0
    ) {
      validationErrors.errors['sapProjectId'] = fieldError(
        'project.error.existingProjectObjectWBS'
      );
    }
  }

  return validationErrors;
}

async function upsertProjectPermissions(
  tx: DatabaseTransactionConnection,
  permissionValues: (string | boolean)[][]
) {
  return await tx.many(sql.type(projectIdSchema)`
    INSERT INTO app.project_permission (project_id, user_id, can_write)
    VALUES (${sql.join(
      permissionValues.map((val) => sql.join(val, sql.fragment`, `)),
      sql.fragment`), (`
    )})
    ON CONFLICT (project_id, user_id) DO
    UPDATE SET (project_id, user_id, can_write) = (EXCLUDED.project_id, EXCLUDED.user_id, EXCLUDED.can_write)
    RETURNING project_id as "projectId";
  `);
}

export async function baseProjectUpsert(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  user: User
) {
  if (hasErrors(await validateUpsertProject(tx, project))) {
    logger.error('Invalid project data', { input: project });
    throw new Error('Invalid project data');
  }
  const result = await upsertBaseProject(tx, project, user.id);
  return result.projectId;
}

export async function projectPermissionUpsert(
  projectPermissions: ProjectPermission[],
  tx?: DatabaseTransactionConnection
) {
  const conn = tx ?? getPool();
  const permissionValues = projectPermissions.map((permission) => Object.values(permission));
  const result = await upsertProjectPermissions(conn, permissionValues);

  return result;
}

export async function getProjectUserPermissions(projectId: string) {
  return await getPool().many(sql.type(
    z.object({ userId: z.string(), userName: z.string(), canWrite: z.boolean() })
  )`
  SELECT u.id as "userId", u.name as "userName", COALESCE(pp.can_write, false) as "canWrite"
  FROM app.user u
  LEFT JOIN app.project_permission pp ON u.id = pp.user_id AND pp.project_id = ${projectId};`);
}
