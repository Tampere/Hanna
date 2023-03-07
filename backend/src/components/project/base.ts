import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';

import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';
import { codeIdFragment } from '@backend/router/code';

import { FormErrors, fieldError, hasErrors } from '@shared/formerror';
import { UpsertProject, projectIdSchema } from '@shared/schema/project/base';
import { User } from '@shared/schema/user';

async function upsertBaseProject(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  userId: string
) {
  const data = {
    project_name: project.projectName,
    description: project.description,
    owner: project.owner,
    sap_project_id: project.sapProjectId,
    updated_by: userId,
  };

  const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);

  // Update committees in a transaction
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

  tx.query(sql.untyped`
    DELETE FROM app.project_committee
    WHERE project_id = ${upsertResult.id}
  `);

  await Promise.all(
    project.committees.map((committee) =>
      tx.any(sql.untyped`
        INSERT INTO app.project_committee (project_id, committee_type)
        VALUES (
          ${upsertResult.id},
          ${codeIdFragment('Lautakunta', committee)}
        );
      `)
    )
  );
  return upsertResult;
}

export async function getProject(id: string) {
  const project = await getPool().maybeOne(sql.type(projectIdSchema)`
    SELECT
      id,
      description,
      project_name AS "projectName",
      created_at AS "createdAt",
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

export async function deleteProject(id: string) {
  const project = await getPool().any(sql.type(projectIdSchema)`
    UPDATE app.project
    SET
      deleted = true
    WHERE id = ${id}
  `);
  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }
  return project;
}

export async function validateUpsertProject(
  tx: DatabaseTransactionConnection,
  values: UpsertProject
) {
  const validationErrors: FormErrors<UpsertProject> = { errors: {} };

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
        'project.error.existingProjectObjectWBS'
      );
    }
  }

  return validationErrors;
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
  return result.id;
}
