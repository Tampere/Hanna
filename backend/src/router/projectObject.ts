import { TRPCError } from '@trpc/server';
import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import { CodeId } from '@shared/schema/code';
import { nonEmptyString } from '@shared/schema/common';
import { costEstimateSchema } from '@shared/schema/project';
import { updateGeometryResultSchema, updateGeometrySchema } from '@shared/schema/projectObject';
import {
  UpsertProjectObject,
  dbProjectObjectSchema,
  deleteProjectObjectSchema,
  getProjectObjectParams,
  upsertProjectObjectSchema,
} from '@shared/schema/projectObject';

const projectObjectFragment = sql.fragment`
  SELECT
     project_id AS "projectId",
     id,
     object_name AS "objectName",
     description AS "description",
     (lifecycle_state).id AS "lifecycleState",
     (object_type).id AS "objectType",
     (object_category).id AS "objectCategory",
     (object_usage).id AS "objectUsage",
     person_responsible AS "personResponsible",
     start_date AS "startDate",
     end_date AS "endDate",
     sap_wbs_id AS "sapWBSId",
     ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
     (landownership).id AS "landownership",
     (location_on_property).id AS "locationOnProperty",
     height
  FROM app.project_object
  WHERE deleted = false
`;

async function getProjectObject(projectId: string, id: string) {
  return await getPool().one(sql.type(dbProjectObjectSchema)`
    ${projectObjectFragment}
    AND project_id = ${projectId}
    AND id = ${id}
  `);
}

function codeIdFragment(codeListId: CodeId['codeListId'], codeId: CodeId['id'] | undefined | null) {
  if (!codeId) return sql.fragment`NULL`;
  return sql.fragment`
    (${sql.join([codeListId, codeId], sql.fragment`,`)})
  `;
}

async function deleteProjectObject(id: string) {
  const projectObject = await getPool().maybeOne(sql.type(dbProjectObjectSchema)`
    UPDATE app.project_object
    SET
      deleted = true
    WHERE id = ${id}
    RETURNING id
  `);

  if (!projectObject) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }
  return projectObject;
}

async function upsertProjectObject(projectObject: UpsertProjectObject, userId: string) {
  const data = {
    project_id: projectObject.projectId,
    object_name: projectObject.objectName,
    description: projectObject.description,
    lifecycle_state: codeIdFragment('KohteenElinkaarentila', projectObject.lifecycleState),
    object_type: codeIdFragment('KohdeTyyppi', projectObject.objectType),
    object_category: codeIdFragment('KohteenOmaisuusLuokka', projectObject.objectCategory),
    object_usage: codeIdFragment('KohteenToiminnallinenKayttoTarkoitus', projectObject.objectUsage),
    person_responsible: projectObject.personResponsible,
    start_date: projectObject.startDate,
    end_date: projectObject.endDate,
    sap_wbs_id: projectObject.sapWBSId ?? null,
    landownership: codeIdFragment('KohteenMaanomistusLaji', projectObject.landownership),
    location_on_property: codeIdFragment(
      'KohteenSuhdePeruskiinteistoon',
      projectObject.locationOnProperty
    ),
    height: projectObject.height ?? null,
    updated_by: userId,
  };

  const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);

  if (projectObject.id) {
    return getPool().one(
      sql.type(z.object({ id: z.string() }))`
        UPDATE app.project_object
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE project_id = ${projectObject.projectId}
          AND id = ${projectObject.id}
        RETURNING id`
    );
  } else {
    return getPool().one(
      sql.type(z.object({ id: z.string() }))`
        INSERT INTO app.project_object (${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${sql.join(values, sql.fragment`,`)})
        RETURNING id`
    );
  }
}

export const createProjectObjectRouter = (t: TRPC) =>
  t.router({
    upsert: t.procedure.input(upsertProjectObjectSchema).mutation(async ({ input, ctx }) => {
      const result = await upsertProjectObject(input, ctx.user.id);
      return getProjectObject(input.projectId, result.id);
    }),

    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input, ctx }) => {
      const { id, features } = input;
      return getPool().one(sql.type(updateGeometryResultSchema)`
        WITH featureCollection AS (
          SELECT ST_Collect(
            ST_GeomFromGeoJSON(value->'geometry')
          ) AS resultGeom
          FROM jsonb_array_elements(${features}::jsonb)
        )
        UPDATE app.project_object
        SET geom = featureCollection.resultGeom
        FROM featureCollection
        WHERE id = ${id}
        RETURNING id, ST_AsGeoJSON(geom) AS geom
      `);
    }),

    get: t.procedure.input(getProjectObjectParams).query(async ({ input, ctx }) => {
      return getProjectObject(input.projectId, input.id);
    }),

    getByProjectId: t.procedure
      .input(z.object({ projectId: nonEmptyString }))
      .query(async ({ input, ctx }) => {
        return getPool().any(sql.type(dbProjectObjectSchema)`
        ${projectObjectFragment}
        AND project_id = ${input.projectId}
      `);
      }),

    delete: t.procedure.input(deleteProjectObjectSchema).mutation(async ({ input }) => {
      const { id } = input;
      return await deleteProjectObject(id);
    }),

    getCostEstimates: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      const { id } = input;
      const result = await getPool().any(sql.type(costEstimateSchema)`
        SELECT
          year,
          jsonb_agg(
            jsonb_build_object(
              'id', id,
              'amount', amount
            )
          ) AS estimates
        FROM app.cost_estimate
        WHERE project_object_id = ${id}
        GROUP BY year
        ORDER BY year ASC
      `);
      return result;
    }),
  });
