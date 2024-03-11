import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import {
  baseProjectUpsert,
  validateUpsertProject as baseProjectValidate,
} from '@backend/components/project/base';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';

import { hasErrors } from '@shared/formerror';
import { projectIdSchema } from '@shared/schema/project/base';
import { DetailplanProject, dbDetailplanSchema } from '@shared/schema/project/detailplan';
import { User } from '@shared/schema/user';

const selectProjectFragment = sql.fragment`
  SELECT
    project.id AS "projectId",
    project_name AS "projectName",
    description,
    project.start_date AS "startDate",
    project.end_date AS "endDate",
    owner,
    created_at AS "createdAt",
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    (project.lifecycle_state).id AS "lifecycleState",
    sap_project_id AS "sapProjectId",
    diary_id AS "diaryId",
    diary_date AS "diaryDate",
    (subtype).id AS "subtype",
    (planning_zone).id AS "planningZone",
    preparer,
    technical_planner AS "technicalPlanner",
    district,
    block_name AS "blockName",
    address_text AS "addressText",
    detailplan_id AS "detailplanId",
    initiative_date AS "initiativeDate",
    applicant_name AS "applicantName",
    applicant_address AS "applicantAddress",
    applicant_objective AS "applicantObjective",
    additional_info AS "additionalInfo",
    (
      SELECT array_agg(user_id)
      FROM app.project_permission
      WHERE project_id = project.id AND can_write = true
    ) AS "writeUsers"
  FROM app.project
  LEFT JOIN app.project_detailplan ON project_detailplan.id = project.id
  WHERE deleted = false
`;

export async function getProject(id: string, tx?: DatabaseTransactionConnection) {
  const conn = tx ?? getPool();

  const project = await conn.maybeOne(sql.type(dbDetailplanSchema)`
    ${selectProjectFragment}
    AND project_detailplan.id = ${id}
  `);

  if (!project) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  const committees = await conn.any(sql.type(z.object({ id: z.string() }))`
    SELECT (committee_type).id FROM app.project_committee
    WHERE project_id = ${id}
  `);

  return { ...project, committees: committees.map(({ id }) => id) };
}

export async function projectUpsert(
  project: DetailplanProject,
  user: User,
  keepOwnerRights: boolean = false
) {
  return await getPool().transaction(async (tx) => {
    if (hasErrors(await baseProjectValidate(tx, project))) {
      logger.error('projectUpsert: validation failed', { project });
      throw new Error('Invalid project data');
    }

    const id = await baseProjectUpsert(tx, project, user, keepOwnerRights);
    await addAuditEvent(tx, {
      eventType: 'detailplanProject.upsertProject',
      eventData: project,
      eventUser: user.id,
    });

    const data = {
      id,
      diary_id: project.diaryId ?? null,
      diary_date: project.diaryDate ?? null,
      subtype: codeIdFragment('AsemakaavaHanketyyppi', project.subtype) ?? null,
      planning_zone: codeIdFragment('AsemakaavaSuunnittelualue', project.planningZone) ?? null,
      preparer: project.preparer,
      technical_planner: project.technicalPlanner ?? null,
      district: project.district,
      block_name: project.blockName,
      address_text: project.addressText,
      initiative_date: project.initiativeDate ?? null,
      applicant_name: project.applicantName ?? null,
      applicant_address: project.applicantAddress ?? null,
      applicant_objective: project.applicantObjective ?? null,
      additional_info: project.additionalInfo ?? null,
    };

    const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
    const values = Object.values(data);

    const upsertResult = project.projectId
      ? await tx.one(sql.type(projectIdSchema)`
        UPDATE app.project_detailplan
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE id = ${project.projectId}
        RETURNING id AS "projectId"
      `)
      : await tx.one(sql.type(projectIdSchema)`
        INSERT INTO app.project_detailplan (${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${sql.join(values, sql.fragment`,`)})
        RETURNING id AS "projectId"
      `);

    return getProject(upsertResult.projectId, tx);
  });
}

export async function validateUpsertProject(
  project: DetailplanProject,
  tx: DatabaseTransactionConnection | null,
) {
  const conn = tx ?? getPool();
  return baseProjectValidate(conn, project);
}

export async function getNextDetailplanId() {
  const { id } = await getPool().one(
    sql.type(
      z.object({ id: z.number() }),
    )`SELECT COALESCE(MAX(detailplan_id) + 1, 1) AS id FROM app.project_detailplan`,
  );
  return id;
}
