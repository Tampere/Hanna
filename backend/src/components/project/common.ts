import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { baseProjectUpsert } from '@backend/components/project/base';
import { getPool, sql } from '@backend/db';

import { projectIdSchema } from '@shared/schema/project/base';
import { CommonProject, dbCommonProjectSchema } from '@shared/schema/project/common';
import { User } from '@shared/schema/user';

const selectProjectFragment = sql.fragment`
  SELECT
    project_common.id,
    project.id AS "parentId",
    project_name AS "projectName",
    description,
    owner,
    person_in_charge AS "personInCharge",
    start_date AS "startDate",
    end_date AS "endDate",
    geohash,
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    (lifecycle_state).id AS "lifecycleState",
    (project_type).id AS "projectType",
    sap_project_id AS "sapProjectId"
  FROM app.project
  LEFT JOIN app.project_common ON project_common.id = project.id
  WHERE deleted = false
`;

export async function getProject(id: string, tx?: DatabaseTransactionConnection) {
  const conn = tx ?? getPool();

  const project = await conn.maybeOne(sql.type(dbCommonProjectSchema)`
    ${selectProjectFragment}
    AND project_common.id = ${id}
  `);

  if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

  const committees = await conn.any(sql.type(z.object({ id: z.string() }))`
    SELECT (committee_type).id
    FROM app.project_committee
    WHERE project_id = ${id}
  `);

  return { ...project, committees: committees.map(({ id }) => id) };
}

export async function projectUpsert(project: CommonProject, user: User) {
  return getPool().transaction(async (tx) => {
    const id = await baseProjectUpsert(tx, project, user);
    await addAuditEvent(tx, {
      eventType: 'projectCommon.upsertProject',
      eventData: project,
      eventUser: user.id,
    });

    const data = {
      id,
      start_date: project.startDate,
      end_date: project.endDate,
      lifecycle_state: codeIdFragment('HankkeenElinkaarentila', project.lifecycleState),
      project_type: codeIdFragment('HankeTyyppi', project.projectType),
      person_in_charge: project.personInCharge,
    };

    const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
    const values = Object.values(data);

    const upsertResult = project.id
      ? await tx.one(sql.type(projectIdSchema)`
        UPDATE app.project_common
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE id = ${project.id}
        RETURNING id
      `)
      : await tx.one(sql.type(projectIdSchema)`
        INSERT INTO app.project_common (${sql.join(identifiers, sql.fragment`,`)})
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

    return getProject(upsertResult.id, tx);
  });
}

export async function validateUpsertProject(input: CommonProject) {
  // !FIXME: implement, first validate base project, then common project
  /*
  if (values?.id) {
    const estimateRange = await getPool().maybeOne(sql.untyped`
    SELECT
      extract(year FROM ${values?.startDate}::date) <= min(cost_estimate.year) AS "validStartDate",
      extract(year FROM ${values?.endDate}::date) >= max(cost_estimate.year) AS "validEndDate"
    FROM app.cost_estimate
    WHERE project_id = ${values?.id}
    GROUP BY project_id;
  `);

    if (estimateRange?.validStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('project.error.costEstimateNotIncluded');
    }

    if (estimateRange?.validEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('project.error.costEstimateNotIncluded');
    }
  }

  // Check that project start date is not after end date
  if (values.startDate >= values.endDate) {
    validationErrors.errors['startDate'] = fieldError('project.error.endDateBeforeStartDate');
    validationErrors.errors['endDate'] = fieldError('project.error.endDateBeforeStartDate');
  }
  */
  return { errors: {} };
}
