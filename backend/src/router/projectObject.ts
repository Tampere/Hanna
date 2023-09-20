import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection, ValueExpression } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { getPool, sql } from '@backend/db';
import { TRPC } from '@backend/router';

import { nonEmptyString } from '@shared/schema/common';
import {
  UpdateProjectObject,
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
     suunnitteluttaja_user AS "suunnitteluttajaUser",
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
  projectObject: UpdateProjectObject
) {
  if (!Array.isArray(projectObject.objectType)) {
    return;
  }

  await tx.query(sql.untyped`
    DELETE FROM app.project_object_type WHERE project_object_id = ${projectObject.id}
  `);

  const tuples = projectObject.objectType.map((type) => [projectObject.id, type]);

  await tx.any(sql.untyped`
    INSERT INTO app.project_object_type (project_object_id, object_type)
    SELECT
      t.project_object_id,
      ('KohdeTyyppi', t.object_type)::app.code_id
    FROM ${sql.unnest(tuples, ['uuid', 'text'])} AS t (project_object_id, object_type);
  `);
}

async function updateObjectCategories(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateProjectObject
) {
  if (!Array.isArray(projectObject.objectCategory)) {
    return;
  }

  await tx.query(sql.untyped`
    DELETE FROM app.project_object_category WHERE project_object_id = ${projectObject.id}
  `);

  const tuples = projectObject.objectCategory.map((category) => [projectObject.id, category]);

  await tx.any(sql.untyped`
    INSERT INTO app.project_object_category (project_object_id, object_category)
    SELECT
      t.project_object_id,
      ('KohteenOmaisuusLuokka', t.object_category)::app.code_id
    FROM ${sql.unnest(tuples, ['uuid', 'text'])} AS t (project_object_id, object_category);
  `);
}

async function updateObjectUsages(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateProjectObject
) {
  if (!Array.isArray(projectObject.objectUsage)) {
    return;
  }

  await tx.query(sql.untyped`
    DELETE FROM app.project_object_usage WHERE project_object_id = ${projectObject.id}
  `);

  const tuples = projectObject.objectUsage.map((usage) => [projectObject.id, usage]);

  await tx.any(sql.untyped`
    INSERT INTO app.project_object_usage (project_object_id, object_usage)
    SELECT
      t.project_object_id,
      ('KohteenToiminnallinenKayttoTarkoitus', t.object_usage)::app.code_id
    FROM ${sql.unnest(tuples, ['uuid', 'text'])} AS t (project_object_id, object_usage);
  `);
}

async function updateObjectRoles(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateProjectObject
) {
  if (!Array.isArray(projectObject.objectUserRoles)) {
    return;
  }

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

/**
 * Fetches a single project object from the database.
 * @param {DatabaseTransactionConnection} [tx] - Databse transaction connection.
 * @param {string} projectObjectId - The ID of the project object to fetch.
 * @returns {Promise<ProjectObject>} - Returns a promise that resolves to the fetched project object.
 */

export async function getProjectObject(tx: DatabaseTransactionConnection, projectObjectId: string) {
  return tx.one(sql.type(dbProjectObjectSchema)`
    ${projectObjectFragment}
    AND id = ${projectObjectId}
  `);
}

/**
 * Fetches multiple project objects from the database.
 * @param {DatabaseTransactionConnection} tx - Database transaction connection.
 * @param {string[]} projectObjectIds - The IDs of the project objects to fetch.
 * @returns {Promise<ProjectObject[]>} - Returns a promise that resolves to the fetched project objects.
 */

export async function getProjectObjects(
  tx: DatabaseTransactionConnection,
  projectObjectIds: string[]
) {
  return tx.many(sql.type(dbProjectObjectSchema)`
    ${projectObjectFragment}
    AND id = ANY(${sql.array(projectObjectIds, 'uuid')})
  `);
}
function isUpdate(input: UpsertProjectObject): input is UpdateProjectObject {
  return 'id' in input;
}

/**
 * Returns the data to be inserted or updated in the database. Mostly renames
 * the fields to match the database column names and filters out the undefined fields
 * @param projectObject - the project object to be inserted (full data) or updated (partial)
 * @param userId - the id of the user performing the update
 * @returns the data to be inserted or updated in the database
 */

function getUpdateData(
  projectObject: UpsertProjectObject,
  userId: string
): Record<string, ValueExpression> {
  const data = {
    project_id: projectObject.projectId,
    object_name: projectObject.objectName,
    description: projectObject.description,
    lifecycle_state:
      projectObject.lifecycleState &&
      codeIdFragment('KohteenElinkaarentila', projectObject.lifecycleState),
    suunnitteluttaja_user: projectObject.suunnitteluttajaUser,
    rakennuttaja_user: projectObject.rakennuttajaUser,
    start_date: projectObject.startDate,
    end_date: projectObject.endDate,
    sap_wbs_id: projectObject.sapWBSId,
    landownership:
      projectObject.landownership &&
      codeIdFragment('KohteenMaanomistusLaji', projectObject.landownership),
    location_on_property:
      projectObject.locationOnProperty &&
      codeIdFragment('KohteenSuhdePeruskiinteistoon', projectObject.locationOnProperty),
    height: projectObject.height,
    updated_by: userId,
  };
  // filter undefined values
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as Record<string, ValueExpression>;
}

/**
 * This function is used to insert or update a project object in the database.
 * It first prepares the data to be inserted or updated, then performs the operation.
 * If the project object already exists (isUpdate is true), it updates the existing record.
 * If the project object does not exist (isUpdate is false), it inserts a new record.
 * After the operation, it updates the object types, categories, usages, and roles.
 * Finally, it returns the result of the operation.
 *
 * @param tx - The database transaction connection
 * @param projectObject - The project object to be inserted or updated
 * @param userId - The id of the user performing the operation
 * @returns The result of the operation
 */

export async function upsertProjectObject(
  tx: DatabaseTransactionConnection,
  projectObject: UpsertProjectObject,
  userId: string
) {
  const data = getUpdateData(projectObject, userId);
  const idents = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);
  const upsertResultSchema = z.object({ id: nonEmptyString });

  await addAuditEvent(tx, {
    eventType: 'projectObject.upsert',
    eventData: projectObject,
    eventUser: userId,
  });

  const upsertResult = isUpdate(projectObject)
    ? await tx.one(sql.type(upsertResultSchema)`
          UPDATE app.project_object
          SET (${sql.join(idents, sql.fragment`,`)}) = ROW(${sql.join(values, sql.fragment`,`)})
          WHERE id = ${projectObject.id}
          RETURNING id
      `)
    : await tx.one(sql.type(upsertResultSchema)`
          INSERT INTO app.project_object (${sql.join(idents, sql.fragment`,`)})
          VALUES (${sql.join(values, sql.fragment`,`)})
          RETURNING id
      `);

  await updateObjectTypes(tx, { ...projectObject, id: upsertResult.id });
  await updateObjectCategories(tx, { ...projectObject, id: upsertResult.id });
  await updateObjectUsages(tx, { ...projectObject, id: upsertResult.id });
  await updateObjectRoles(tx, { ...projectObject, id: upsertResult.id });

  return upsertResult;
}

export const createProjectObjectRouter = (t: TRPC) =>
  t.router({
    upsert: t.procedure.input(upsertProjectObjectSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        const result = await upsertProjectObject(tx, input, ctx.user.id);
        return getProjectObject(tx, result.id);
      });
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
      return await getPool().connect(async (conn) => {
        const projectObject = await getProjectObject(conn, input.id);
        console.log(projectObject);
        return projectObject;
      });
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
