import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { codeIdFragment } from '@backend/components/code/index.js';
import {
  baseProjectUpsert,
  validateUpsertProject as baseProjectValidate,
} from '@backend/components/project/base.js';
import { updateProjectGeometry } from '@backend/components/project/index.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { hasErrors } from '@shared/formerror.js';
import { projectIdSchema } from '@shared/schema/project/base.js';
import { InvestmentProject, dbInvestmentProjectSchema } from '@shared/schema/project/investment.js';
import { User } from '@shared/schema/user.js';

const selectProjectFragment = sql.fragment`
  SELECT
    project_investment.id AS "projectId",
    project.id AS "parentId",
    project_name AS "projectName",
    description,
    owner,
    project.start_date AS "startDate",
    project.end_date AS "endDate",
    geohash,
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    (project.lifecycle_state).id AS "lifecycleState",
    sap_project_id AS "sapProjectId",
    (
      SELECT COALESCE(array_agg(user_id), '{}')
      FROM app.project_permission
      WHERE project_id = project.id AND can_write = true
    ) AS "writeUsers"
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

export async function projectUpsert(
  project: InvestmentProject,
  user: User,
  keepOwnerRights: boolean = false,
) {
  return getPool().transaction(async (tx) => {
    if (hasErrors(await validateUpsertProject(project, tx))) {
      logger.error('Invalid project', { project });
      throw new Error('Invalid project');
    }

    await addAuditEvent(tx, {
      eventType: 'investmentProject.upsertProject',
      eventData: project,
      eventUser: user.id,
    });

    const id = await baseProjectUpsert(tx, project, user, keepOwnerRights);

    const upsertResult = project.projectId
      ? await tx.one(sql.type(projectIdSchema)`
        UPDATE app.project_investment
        SET id = ${id}
        WHERE id = ${project.projectId}
        RETURNING id AS "projectId"
      `)
      : await tx.one(sql.type(projectIdSchema)`
        INSERT INTO app.project_investment (id)
        VALUES (${id})
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
        `),
      ),
    );

    if (project.geom) {
      updateProjectGeometry(
        tx,
        {
          projectId: upsertResult.projectId,
          features: project.geom,
        },
        user,
      );
    }

    return getProject(upsertResult.projectId, tx);
  });
}

export async function validateUpsertProject(
  project: InvestmentProject,
  tx: DatabaseTransactionConnection | null,
) {
  const conn = tx ?? getPool();
  return baseProjectValidate(conn, project);
}

export async function getParticipatedProjects(userId: string) {
  return getPool().any(sql.type(z.object({ projectId: z.string(), projectName: z.string() }))`
    SELECT
      p.id as "projectId",
      p.project_name as "projectName"
    FROM app.project p, app.project_investment pi
    WHERE p.id = pi.id AND p.owner = ${userId} AND p.deleted = false
    UNION
    SELECT
    	p.id as "projectId",
      p.project_name as "projectName"
    FROM app.project_permission pp
    LEFT JOIN app.project_investment pi ON pp.project_id = pi.id
    LEFT JOIN app.project p ON pi.id = pp.project_id
    WHERE p.id = pi.id AND pp.user_id = ${userId} AND pp.can_write = TRUE AND p.deleted = false;
  `);
}
