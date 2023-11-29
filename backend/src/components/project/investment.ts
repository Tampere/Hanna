import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { updateProjectGeometry } from '@backend/components/project';
import {
  baseProjectUpsert,
  validateUpsertProject as baseProjectValidate,
} from '@backend/components/project/base';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { hasErrors } from '@shared/formerror';
import { projectIdSchema } from '@shared/schema/project/base';
import { InvestmentProject, dbInvestmentProjectSchema } from '@shared/schema/project/investment';
import { User } from '@shared/schema/user';

const selectProjectFragment = sql.fragment`
  SELECT
    project_investment.id AS "projectId",
    project.id AS "parentId",
    project_name AS "projectName",
    description,
    owner,
    person_in_charge AS "personInCharge",
    project.start_date AS "startDate",
    project.end_date AS "endDate",
    geohash,
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    (project.lifecycle_state).id AS "lifecycleState",
    sap_project_id AS "sapProjectId"
  FROM app.project
  LEFT JOIN app.project_investment ON project_investment.id = project.id
  WHERE deleted = false
`;

export async function getProject(id: string, tx?: DatabaseTransactionConnection) {
  const conn = tx ?? getPool();

  const project = await conn.maybeOne(sql.type(dbInvestmentProjectSchema)`
    ${selectProjectFragment}
    AND project_investment.id = ${id}
  `);

  if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

  const committees = await conn.any(sql.type(z.object({ id: z.string() }))`
    SELECT (committee_type).id
    FROM app.project_committee
    WHERE project_id = ${id}
  `);

  return { ...project, committees: committees.map(({ id }) => id) };
}

export async function projectUpsert(project: InvestmentProject, user: User) {
  return getPool().transaction(async (tx) => {
    if (hasErrors(await validateUpsertProject(project, tx))) {
      logger.error('Invalid project', { project });
      throw new Error('Invalid project');
    }

    const id = await baseProjectUpsert(tx, project, user);
    await addAuditEvent(tx, {
      eventType: 'investmentProject.upsertProject',
      eventData: project,
      eventUser: user.id,
    });

    const data = {
      id,
      person_in_charge: project.personInCharge,
    };

    const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
    const values = Object.values(data);

    const upsertResult = project.projectId
      ? await tx.one(sql.type(projectIdSchema)`
        UPDATE app.project_investment
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE id = ${project.projectId}
        RETURNING id AS "projectId"
      `)
      : await tx.one(sql.type(projectIdSchema)`
        INSERT INTO app.project_investment (${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${sql.join(values, sql.fragment`,`)})
        RETURNING id AS "projectId"
      `);

    tx.query(sql.untyped`
      DELETE FROM app.project_committee
      WHERE project_id = ${upsertResult.projectId}
    `);

    await Promise.all(
      project.committees.map((committee) =>
        tx.any(sql.untyped`
          INSERT INTO app.project_committee (project_id, committee_type)
          VALUES (
            ${upsertResult.projectId},
            ${codeIdFragment('Lautakunta', committee)}
          );
        `)
      )
    );

    if (project.geom) {
      updateProjectGeometry(
        tx,
        {
          projectId: upsertResult.projectId,
          features: project.geom,
        },
        user
      );
    }

    return getProject(upsertResult.projectId, tx);
  });
}

export async function validateUpsertProject(
  project: InvestmentProject,
  tx: DatabaseTransactionConnection | null
) {
  const conn = tx ?? getPool();
  return baseProjectValidate(conn, project);
}
