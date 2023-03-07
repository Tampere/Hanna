import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { baseProjectUpsert } from '@backend/components/project/base';
import { getPool, sql } from '@backend/db';
import { codeIdFragment } from '@backend/router/code';

import { projectIdSchema } from '@shared/schema/project/base';
import { DetailplanProject, dbDetailplanSchema } from '@shared/schema/project/detailplan';
import { User } from '@shared/schema/user';

const selectProjectFragment = sql.fragment`
  SELECT
    project.id,
    project_name AS "projectName",
    description,
    created_at AS "createdAt",
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    sap_project_id AS "sapProjectId",
    diary_id AS "diaryId",
    diary_date AS "diaryDate",
    subtype,
    planning_zone AS "planningZone",
    preparer,
    technical_planner AS "technicalPlanner",
    district,
    block_name AS "blockName",
    address_text AS "addressText",
    detailplan_id AS "detailplanId",
    initiative_date AS "initiativeDate",
    applicant_name AS "applicantName",
    applicant_address AS "applicantAddress",
    applicant_objective AS "applicantObjective"
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

export async function projectUpsert(project: DetailplanProject, user: User) {
  await getPool().transaction(async (tx) => {
    const id = await baseProjectUpsert(tx, project, user);

    const data = {
      id,
      diary_id: project.diaryId ?? null,
      diary_date: project.diaryDate ?? null,
      subtype: codeIdFragment('AsemakaavaHanketyyppi', project.subtype),
      planning_zone: codeIdFragment('AsemakaavaSuunnittelualue', project.planningZone),
      preparer: project.preparer,
      technical_planner: project.technicalPlanner,
      district: project.district,
      block_name: project.blockName,
      address_text: project.addressText,
      detailplan_id: project.detailplanId,
      initiative_date: project.initiativeDate,
      applicant_name: project.applicantName,
      applicant_address: project.applicantAddress,
      applicant_objective: project.applicantObjective,
    };

    const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
    const values = Object.values(data);

    const upsertResult = project.id
      ? await tx.one(sql.type(projectIdSchema)`
        UPDATE app.project_detailplan
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE id = ${project.id}
        RETURNING id
      `)
      : await tx.one(sql.type(projectIdSchema)`
        INSERT INTO app.project_detailplan (${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${sql.join(values, sql.fragment`,`)})
        RETURNING id
      `);

    return getProject(upsertResult.id, tx);
  });
}

export async function validateUpsertProject(input: DetailplanProject) {
  // !FIXME: implement, first validate base project, then common project
  return { errors: {} };
}
