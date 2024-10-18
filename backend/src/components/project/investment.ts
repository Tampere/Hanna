import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { codeIdFragment } from '@backend/components/code/index.js';
import {
  baseProjectUpsert,
  validateUpsertProject as baseProjectValidate,
  getProjectGeometryDumpFragment,
} from '@backend/components/project/base.js';
import { updateProjectGeometry } from '@backend/components/project/index.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { hasErrors, stringifyFieldErrors } from '@shared/formerror.js';
import { projectIdSchema } from '@shared/schema/project/base.js';
import { InvestmentProject, dbInvestmentProjectSchema } from '@shared/schema/project/investment.js';
import { User } from '@shared/schema/user.js';

const getSelectProjectFragment = (id: string) => sql.fragment`
WITH dump AS (${getProjectGeometryDumpFragment()})
  SELECT
    project_investment.id AS "projectId",
    project.id AS "parentId",
    project_name AS "projectName",
    description,
    owner,
    project.start_date AS "startDate",
    project.end_date AS "endDate",
    (project_investment.target).id AS "target",
    geohash,
    dump.geom,
    dump.geometry_dump AS "geometryDump",
    (project.lifecycle_state).id AS "lifecycleState",
    sap_project_id AS "sapProjectId",
    (
      SELECT COALESCE(array_agg(user_id), '{}')
      FROM app.project_permission
      WHERE project_id = project.id AND can_write = true
    ) AS "writeUsers",
    project.covers_entire_municipality AS "coversMunicipality"
  FROM app.project
  LEFT JOIN app.project_investment ON project_investment.id = project.id
  LEFT JOIN dump ON dump.id = project.id
  WHERE deleted = false AND project_investment.id = ${id}
`;

export async function getProject(id: string, tx?: DatabaseTransactionConnection) {
  const conn = tx ?? getPool();

  const project = await conn.maybeOne(sql.type(dbInvestmentProjectSchema)`
    ${getSelectProjectFragment(id)}
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
    const validationResult = await validateUpsertProject(project, tx);
    if (hasErrors(validationResult)) {
      logger.error('Invalid project', { project });
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Invalid project: ${stringifyFieldErrors(validationResult)}`,
      });
    }

    await addAuditEvent(tx, {
      eventType: 'investmentProject.upsertProject',
      eventData: project,
      eventUser: user.id,
    });

    const id = await baseProjectUpsert(tx, project, user, keepOwnerRights);

    const data = {
      id,
      target: codeIdFragment('HankkeenSitovuus', project.target),
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

    await tx.query(sql.untyped`
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
      await updateProjectGeometry(
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
