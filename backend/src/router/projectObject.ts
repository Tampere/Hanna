import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection, ValueExpression } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { getPool, sql } from '@backend/db';
import { logger } from '@backend/logging';
import { TRPC } from '@backend/router';

import { FormErrors, fieldError, hasErrors } from '@shared/formerror';
import { nonEmptyString } from '@shared/schema/common';
import {
  BudgetUpdate,
  UpdateGeometry,
  UpdateProjectObject,
  UpsertProjectObject,
  dbProjectObjectSchema,
  deleteProjectObjectSchema,
  getProjectObjectParams,
  updateBudgetSchema,
  updateGeometryResultSchema,
  updateGeometrySchema,
  upsertProjectObjectSchema,
  yearBudgetSchema,
} from '@shared/schema/projectObject';
import { User } from '@shared/schema/user';

const projectObjectFragment = sql.fragment`
  SELECT
     project_id AS "projectId",
     id AS "projectObjectId",
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

async function deleteProjectObject(projectObjectId: string, user: User) {
  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'projectObject.delete',
      eventData: { projectObjectId },
      eventUser: user.id,
    });
    const projectObject = await tx.maybeOne(sql.type(dbProjectObjectSchema)`
      UPDATE app.project_object
      SET
        deleted = true
      WHERE id = ${projectObjectId}
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
    DELETE FROM app.project_object_type WHERE project_object_id = ${projectObject.projectObjectId}
  `);

  const tuples = projectObject.objectType.map((type) => [projectObject.projectObjectId, type]);

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
    DELETE FROM app.project_object_category WHERE project_object_id = ${projectObject.projectObjectId}
  `);

  const tuples = projectObject.objectCategory.map((category) => [
    projectObject.projectObjectId,
    category,
  ]);

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
    DELETE FROM app.project_object_usage WHERE project_object_id = ${projectObject.projectObjectId}
  `);

  const tuples = projectObject.objectUsage.map((usage) => [projectObject.projectObjectId, usage]);

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
    WHERE project_object_id = ${projectObject.projectObjectId}
  `);

  await Promise.all(
    projectObject.objectUserRoles.map(({ userId, roleId }) =>
      tx.any(sql.untyped`
        INSERT INTO app.project_object_user_role (user_id, project_object_id, object_role)
        VALUES (
          ${userId},
          ${projectObject.projectObjectId},
          ${codeIdFragment('KohdeKayttajaRooli', roleId)}
        );
      `)
    )
  );
}

async function getProjectObjectBudget(projectObjectId: string) {
  return getPool().any(sql.type(yearBudgetSchema)`
    SELECT
      "year",
      jsonb_build_object(
        'amount', amount,
        'forecast', forecast,
        'kayttosuunnitelmanMuutos', kayttosuunnitelman_muutos
      ) AS "budgetItems"
    FROM app.budget
    WHERE project_object_id = ${projectObjectId}
    ORDER BY year ASC
  `);
}

export async function updateProjectObjectBudget(
  tx: DatabaseTransactionConnection,
  projectObjectId: string,
  budgetItems: BudgetUpdate['budgetItems'],
  userId: User['id']
) {
  await addAuditEvent(tx, {
    eventType: 'projectObject.updateBudget',
    eventData: { projectObjectId, budgetItems },
    eventUser: userId,
  });

  await Promise.all(
    budgetItems.map(async (item) => {
      // filter falsy kvs in case of partial update
      const data = Object.fromEntries(
        Object.entries({
          year: item.year,
          amount: item.amount,
          forecast: item.forecast,
          kayttosuunnitelman_muutos: item.kayttosuunnitelmanMuutos,
        }).filter(([, value]) => value !== undefined)
      );

      const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
      const values = Object.values(data);

      await tx.any(sql.untyped`
        INSERT INTO app.budget (project_object_id, ${sql.join(identifiers, sql.fragment`,`)})
        VALUES (${projectObjectId}, ${sql.join(values, sql.fragment`,`)})
        ON CONFLICT (project_object_id, "year")
        DO UPDATE SET
        ${sql.join(
          identifiers.map((identifier) => sql.fragment`${identifier} = EXCLUDED.${identifier}`),
          sql.fragment`,`
        )}
      `);
    })
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
  return 'projectObjectId' in input;
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

export async function validateUpsertProjectObject(
  tx: DatabaseTransactionConnection,
  values: UpsertProjectObject
) {
  const validationErrors: FormErrors<UpsertProjectObject> = { errors: {} };

  if (values?.projectObjectId && values?.startDate && values?.endDate) {
    const budgetRange = await tx.maybeOne(sql.untyped`
    SELECT
      extract(year FROM ${values?.startDate}::date) <= min(budget.year) AS "validStartDate",
      extract(year FROM ${values?.endDate}::date) >= max(budget.year) AS "validEndDate"
    FROM app.budget
    WHERE project_object_id = ${values?.projectObjectId}
    GROUP BY project_object_id;
  `);

    if (budgetRange?.validStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('projectObject.error.budgetNotIncluded');
    }

    if (budgetRange?.validEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('projectObject.error.budgetNotIncluded');
    }
  }
  return validationErrors;
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
  if (hasErrors(await validateUpsertProjectObject(tx, projectObject))) {
    logger.error('Invalid project data', { input: projectObject });
    throw new Error('Invalid project data');
  }

  const data = getUpdateData(projectObject, userId);
  const idents = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);
  const upsertResultSchema = z.object({ projectObjectId: nonEmptyString });

  await addAuditEvent(tx, {
    eventType: 'projectObject.upsert',
    eventData: projectObject,
    eventUser: userId,
  });

  const upsertResult = isUpdate(projectObject)
    ? await tx.one(sql.type(upsertResultSchema)`
          UPDATE app.project_object
          SET (${sql.join(idents, sql.fragment`,`)}) = ROW(${sql.join(values, sql.fragment`,`)})
          WHERE id = ${projectObject.projectObjectId}
          RETURNING id AS "projectObjectId"
      `)
    : await tx.one(sql.type(upsertResultSchema)`
          INSERT INTO app.project_object (${sql.join(idents, sql.fragment`,`)})
          VALUES (${sql.join(values, sql.fragment`,`)})
          RETURNING id AS "projectObjectId"
      `);

  if (projectObject.budgetUpdate?.budgetItems?.length) {
    await updateProjectObjectBudget(
      tx,
      upsertResult.projectObjectId,
      projectObject.budgetUpdate.budgetItems,
      userId
    );
  }
  await updateObjectTypes(tx, { ...projectObject, projectObjectId: upsertResult.projectObjectId });
  await updateObjectCategories(tx, {
    ...projectObject,
    projectObjectId: upsertResult.projectObjectId,
  });
  await updateObjectUsages(tx, { ...projectObject, projectObjectId: upsertResult.projectObjectId });
  await updateObjectRoles(tx, { ...projectObject, projectObjectId: upsertResult.projectObjectId });

  if (projectObject.geom) {
    updateProjectObjectGeometry(
      tx,
      {
        projectObjectId: upsertResult.projectObjectId,
        features: projectObject.geom,
      },
      userId
    );
  }

  return upsertResult;
}

async function updateProjectObjectGeometry(
  tx: DatabaseTransactionConnection,
  input: UpdateGeometry,
  userId: string
) {
  const { projectObjectId, features } = input;

  await addAuditEvent(tx, {
    eventType: 'projectObject.updateGeometry',
    eventData: input,
    eventUser: userId,
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
    WHERE id = ${projectObjectId}
    RETURNING id, ST_AsGeoJSON(geom) AS geom
  `);
}

export const createProjectObjectRouter = (t: TRPC) =>
  t.router({
    get: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      return await getPool().connect(async (conn) => {
        const projectObject = await getProjectObject(conn, input.projectObjectId);
        return projectObject;
      });
    }),

    getBudget: t.procedure
      .input(z.object({ projectObjectId: z.string() }))
      .query(async ({ input }) => {
        return await getProjectObjectBudget(input.projectObjectId);
      }),

    getByProjectId: t.procedure
      .input(z.object({ projectId: nonEmptyString }))
      .query(async ({ input }) => {
        return getProjectObjectsByProjectId(input.projectId);
      }),

    upsertValidate: t.procedure.input(upsertProjectObjectSchema).query(async ({ input }) => {
      return await getPool().connect(async (conn) => {
        return await validateUpsertProjectObject(conn, input);
      });
    }),

    // XXX: only project owner and those with given write permissions can update
    upsert: t.procedure.input(upsertProjectObjectSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        const result = await upsertProjectObject(tx, input, ctx.user.id);
        return getProjectObject(tx, result.projectObjectId);
      });
    }),

    // XXX: only project owner and those with given write permissions can update
    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        return await updateProjectObjectGeometry(tx, input, ctx.user.id);
      });
    }),

    // XXX: only project owner and those with given write permissions can update
    updateBudget: t.procedure
      .input(updateBudgetSchema.required())
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectObjectBudget(
            tx,
            input.projectObjectId,
            input.budgetItems,
            ctx.user.id
          );
        });
      }),

    // XXX: only owner can delete
    delete: t.procedure.input(deleteProjectObjectSchema).mutation(async ({ input, ctx }) => {
      const { projectObjectId } = input;
      return await deleteProjectObject(projectObjectId, ctx.user);
    }),
  });
