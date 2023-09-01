import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import { nonEmptyString } from '@shared/schema/common';
import {
  UpsertProjectObject,
  dbProjectObjectSchema,
  deleteProjectObjectSchema,
  getProjectObjectParams,
  updateGeometryResultSchema,
  updateGeometrySchema,
  upsertProjectObjectSchema,
} from '@shared/schema/projectObject';
import { User } from '@shared/schema/user';

const projectObjectFragment = sql.fragment`
  SELECT
     project_id AS "projectId",
     id,
     object_name AS "objectName",
     description AS "description",
     (lifecycle_state).id AS "lifecycleState",
     suunnittelluttaja_user AS "suunnittelluttajaUser",
     rakennuttaja_user AS "rakennuttajaUser",
     start_date AS "startDate",
     end_date AS "endDate",
     sap_wbs_id AS "sapWBSId",
     ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
     (landownership).id AS "landownership",
     (location_on_property).id AS "locationOnProperty",
     (SELECT json_agg((object_type).id)
      FROM app.project_object_type
      WHERE project_object.id = project_object_type.project_object_id) AS "objectType",
     (SELECT json_agg((object_category).id)
      FROM app.project_object_category
      WHERE project_object.id = project_object_category.project_object_id) AS "objectCategory",
     (SELECT json_agg((object_usage).id)
      FROM app.project_object_usage
      WHERE project_object.id = project_object_usage.project_object_id) AS "objectUsage",
     height,
     '[]'::JSONB AS "objectUserRoles" --TODO: Implement
  FROM app.project_object
  WHERE deleted = false
`;

async function getProjectObject(projectObjectId: string) {
  return getPool().one(sql.type(dbProjectObjectSchema)`
    ${projectObjectFragment}
    AND id = ${projectObjectId}
  `);
}

async function getProjectObjectsByProjectId(projectId: string) {
  return getPool().any(sql.type(dbProjectObjectSchema)`
    ${projectObjectFragment}
    AND project_id = ${projectId}
  `);
}

async function deleteProjectObject(id: string, user: User) {
  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'projectObject.delete',
      eventData: { id },
      eventUser: user.id,
    });
    const projectObject = await tx.maybeOne(sql.type(dbProjectObjectSchema)`
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
  });
}

async function updateObjectTypes(
  tx: DatabaseTransactionConnection,
  projectObject: UpsertProjectObject & { id: string }
) {
  tx.query(sql.untyped`
    DELETE FROM app.project_object_type
    WHERE project_object_id = ${projectObject.id}
  `);

  await Promise.all(
    projectObject.objectType.map((type) =>
      tx.any(sql.untyped`
        INSERT INTO app.project_object_type (project_object_id, object_type)
        VALUES (
          ${projectObject.id},
          ${codeIdFragment('KohdeTyyppi', type)}
        );
      `)
    )
  );
}

async function updateObjectCategories(
  tx: DatabaseTransactionConnection,
  projectObject: UpsertProjectObject & { id: string }
) {
  tx.query(sql.untyped`
    DELETE FROM app.project_object_category
    WHERE project_object_id = ${projectObject.id}
  `);

  await Promise.all(
    projectObject.objectCategory.map((category) =>
      tx.any(sql.untyped`
        INSERT INTO app.project_object_category (project_object_id, object_category)
        VALUES (
          ${projectObject.id},
          ${codeIdFragment('KohteenOmaisuusLuokka', category)}
        );
      `)
    )
  );
}

async function updateObjectUsages(
  tx: DatabaseTransactionConnection,
  projectObject: UpsertProjectObject & { id: string }
) {
  tx.query(sql.untyped`
    DELETE FROM app.project_object_usage
    WHERE project_object_id = ${projectObject.id}
  `);

  await Promise.all(
    projectObject.objectUsage.map((usage) =>
      tx.any(sql.untyped`
        INSERT INTO app.project_object_usage (project_object_id, object_usage)
        VALUES (
          ${projectObject.id},
          ${codeIdFragment('KohteenToiminnallinenKayttoTarkoitus', usage)}
        );
      `)
    )
  );
}

async function updateObjectRoles(
  tx: DatabaseTransactionConnection,
  projectObject: UpsertProjectObject & { id: string; userId: string }
) {
  tx.query(sql.untyped`
    DELETE FROM app.project_object_user_role
    WHERE project_object_id = ${projectObject.id}
  `);

  await Promise.all(
    projectObject.objectUserRoles.map(({ userId, roleId }) =>
      tx.any(sql.untyped`
        INSERT INTO app.project_object_user_role (user_id, project_object_id, object_role)
        VALUES (
          ${userId},
          ${projectObject.id},
          ${codeIdFragment('KohdeKayttajaRooli', roleId)}
        );
      `)
    )
  );
}

async function upsertProjectObject(projectObject: UpsertProjectObject, userId: string) {
  const data = {
    project_id: projectObject.projectId,
    object_name: projectObject.objectName,
    description: projectObject.description,
    lifecycle_state: codeIdFragment('KohteenElinkaarentila', projectObject.lifecycleState),
    suunnittelluttaja_user: projectObject.suunnittelluttajaUser,
    rakennuttaja_user: projectObject.rakennuttajaUser,
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

  return getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'projectObject.upsert',
      eventData: projectObject,
      eventUser: userId,
    });

    const upsertResult = projectObject.id
      ? await tx.one(sql.type(z.object({ id: z.string() }))`
        UPDATE app.project_object
        SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
        WHERE project_id = ${projectObject.projectId}
          AND id = ${projectObject.id}
        RETURNING id`)
      : await tx.one(sql.type(z.object({ id: z.string() }))`
        INSERT INTO app.project_object (${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${sql.join(values, sql.fragment`,`)})
        RETURNING id`);

    await Promise.all([
      updateObjectTypes(tx, { ...projectObject, id: upsertResult.id }),
      updateObjectCategories(tx, { ...projectObject, id: upsertResult.id }),
      updateObjectUsages(tx, { ...projectObject, id: upsertResult.id }),
      updateObjectRoles(tx, { ...projectObject, id: upsertResult.id }),
    ]);

    return upsertResult;
  });
}

export const createProjectObjectRouter = (t: TRPC) =>
  t.router({
    upsert: t.procedure.input(upsertProjectObjectSchema).mutation(async ({ input, ctx }) => {
      const result = await upsertProjectObject(input, ctx.user.id);
      return getProjectObject(result.id);
    }),

    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input, ctx }) => {
      const { id, features } = input;

      return getPool().transaction(async (tx) => {
        await addAuditEvent(tx, {
          eventType: 'projectObject.updateGeometry',
          eventData: input,
          eventUser: ctx.user.id,
        });
        return tx.one(sql.type(updateGeometryResultSchema)`
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
      });
    }),

    get: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      return getProjectObject(input.id);
    }),

    getByProjectId: t.procedure
      .input(z.object({ projectId: nonEmptyString }))
      .query(async ({ input }) => {
        return getProjectObjectsByProjectId(input.projectId);
      }),

    delete: t.procedure.input(deleteProjectObjectSchema).mutation(async ({ input, ctx }) => {
      const { id } = input;
      return await deleteProjectObject(id, ctx.user);
    }),
  });
