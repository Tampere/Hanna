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
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { hasErrors } from '@shared/formerror.js';
import { projectIdSchema } from '@shared/schema/project/base.js';
import { DetailplanProject, dbDetailplanSchema } from '@shared/schema/project/detailplan.js';
import { User } from '@shared/schema/user.js';

const getSelectedProjectFragment = (id: string) => sql.fragment`
WITH dump AS (${getProjectGeometryDumpFragment()})
  SELECT
    project.id AS "projectId",
    project_name AS "projectName",
    description,
    project.start_date AS "startDate",
    project.end_date AS "endDate",
    owner,
    created_at AS "createdAt",
    dump.geom,
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
      SELECT COALESCE(array_agg(user_id), '{}')
      FROM app.project_permission
      WHERE project_id = project.id AND can_write = true
    ) AS "writeUsers"
  FROM app.project
  LEFT JOIN app.project_detailplan ON project_detailplan.id = project.id
  LEFT JOIN dump ON dump.id = project_detailplan.id
  WHERE deleted = false and project_detailplan.id = ${id}
`;

export async function getProject(id: string, tx?: DatabaseTransactionConnection) {
  const conn = tx ?? getPool();

  const project = await conn.maybeOne(sql.type(dbDetailplanSchema)`
    ${getSelectedProjectFragment(id)}
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
  keepOwnerRights: boolean = false,
) {
  return await getPool().transaction(async (tx) => {
    const detailplanProject = { ...project, coversMunicipality: false };

    if (hasErrors(await baseProjectValidate(tx, detailplanProject))) {
      logger.error('projectUpsert: validation failed', { project });
      throw new Error('Invalid project data');
    }

    const id = await baseProjectUpsert(tx, detailplanProject, user, keepOwnerRights);
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
  const detailplanProject = { ...project, coversMunicipality: false };
  return baseProjectValidate(conn, detailplanProject);
}

export async function getNextDetailplanId() {
  const { id } = await getPool().one(
    sql.type(
      z.object({ id: z.number() }),
    )`SELECT COALESCE(MAX(detailplan_id) + 1, 1) AS id FROM app.project_detailplan`,
  );
  return id;
}
