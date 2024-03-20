import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection, ValueExpression } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { codeIdFragment } from '@backend/components/code';
import { getPermissionContext as getProjectPermissionCtx } from '@backend/components/project/base';
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
import {
  ProjectAccessChecker,
  ProjectPermissionContext,
  hasPermission,
  hasWritePermission,
  isProjectObjectIdInput,
  ownsProject,
  permissionContextSchema,
} from '@shared/schema/userPermissions';

const projectObjectFragment = sql.fragment`
  WITH roles AS (
    SELECT json_build_object(
          'roleId', (role).id,
          'userIds', json_agg(user_id) FILTER (WHERE user_id IS NOT NULL),
          'companyContactIds', json_agg(company_contact_id) FILTER (WHERE company_contact_id IS NOT NULL)
        ) AS "objectUserRoles", project_object.id AS project_object_id
      FROM app.project_object_user_role, app.project_object
      WHERE project_object.id = project_object_user_role.project_object_id
	    GROUP BY (role).id, project_object.id
  )
  SELECT
     project_id AS "projectId",
     id AS "projectObjectId",
     object_name AS "objectName",
     description AS "description",
     (lifecycle_state).id AS "lifecycleState",
     (object_stage).id AS "objectStage",
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
    (
      SELECT json_build_object(
        'writeUsers', (SELECT array_agg(user_id) FROM app.project_permission WHERE project_id = project_object.project_id AND can_write = true),
        'owner', (SELECT owner FROM app.project WHERE id = project_object.project_id)
      )
    ) AS "permissionCtx",
     (SELECT COALESCE(json_agg("objectUserRoles"), '[]') FROM roles r WHERE r.project_object_id = project_object.id) AS "objectUserRoles",
      height
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
  projectObject: UpdateProjectObject,
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
  projectObject: UpdateProjectObject,
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
  projectObject: UpdateProjectObject,
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
  projectObject: UpdateProjectObject,
) {
  if (!Array.isArray(projectObject.objectUserRoles)) {
    return;
  }

  tx.query(sql.untyped`
    DELETE FROM app.project_object_user_role
    WHERE project_object_id = ${projectObject.projectObjectId}
  `);

  await Promise.all(
    projectObject.objectUserRoles.map(({ userIds, roleId, companyContactIds }) => [
      ...userIds.map((userId) =>
        tx.any(sql.untyped`
      INSERT INTO app.project_object_user_role (user_id, project_object_id, role)
      VALUES (
        ${userId},
        ${projectObject.projectObjectId},
        ${codeIdFragment('KohdeKayttajaRooli', roleId)}
      );
    `),
      ),
      ...companyContactIds.map((contactId) =>
        tx.any(sql.untyped`
      INSERT INTO app.project_object_user_role (company_contact_id, project_object_id, role)
      VALUES (
        ${contactId},
        ${projectObject.projectObjectId},
        ${codeIdFragment('KohdeKayttajaRooli', roleId)}
      );
    `),
      ),
    ]),
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
  userId: User['id'],
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
        }).filter(([, value]) => value !== undefined),
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
          sql.fragment`,`,
        )}
      `);
    }),
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
  projectObjectIds: string[],
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
  userId: string,
): Record<string, ValueExpression> {
  const data = {
    project_id: projectObject.projectId,
    object_name: projectObject.objectName,
    description: projectObject.description,
    object_stage:
      projectObject.objectStage && codeIdFragment('KohteenLaji', projectObject.objectStage),
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
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Record<string, ValueExpression>;
}

export async function validateUpsertProjectObject(
  tx: DatabaseTransactionConnection,
  values: UpsertProjectObject,
) {
  const validationErrors: FormErrors<UpsertProjectObject> = { errors: {} };

  let dateRange;
  if (values?.projectObjectId && values?.startDate && values?.endDate) {
    dateRange = await tx.maybeOne(sql.untyped`
    WITH budget_range AS (
    SELECT
      ${values.projectObjectId} as id,
      extract(year FROM ${values?.startDate}::date) <= min(budget.year) AS "validBudgetStartDate",
      extract(year FROM ${values?.endDate}::date) >= max(budget.year) AS "validBudgetEndDate"
    FROM app.budget
    WHERE project_object_id = ${values?.projectObjectId}
    GROUP BY project_object_id
    ), project_range AS (
      SELECT
		    ${values.projectObjectId} as id,
        min(p.start_date) <= ${values?.startDate} AS "validProjectStartDate",
        max(p.end_date) >= ${values?.endDate} AS "validProjectEndDate"
      FROM app.project_object po
      LEFT JOIN app.project p ON po.project_id = p.id
      WHERE po.id = ${values?.projectObjectId}
      GROUP BY p.id
    )
    SELECT
      br."validBudgetStartDate",
      br."validBudgetEndDate",
      pr."validProjectStartDate",
      pr."validProjectEndDate"
    FROM project_range pr
	  FULL JOIN budget_range br ON pr.id = br.id;
  `);
  } else if (values?.projectId && values?.startDate && values?.endDate) {
    dateRange = await tx.maybeOne(sql.untyped`
     SELECT
        min(p.start_date) <= ${values?.startDate} AS "validProjectStartDate",
        max(p.end_date) >= ${values?.endDate} AS "validProjectEndDate"
      FROM app.project p
      WHERE p.id = ${values?.projectId}
      GROUP BY p.id
    `);
  }

  if (dateRange?.validProjectStartDate === false) {
    validationErrors.errors['startDate'] = fieldError('projectObject.error.projectNotIncluded');
  } else if (dateRange?.validBudgetStartDate === false) {
    validationErrors.errors['startDate'] = fieldError('projectObject.error.budgetNotIncluded');
  }

  if (dateRange?.validProjectEndDate === false) {
    validationErrors.errors['endDate'] = fieldError('projectObject.error.projectNotIncluded');
  } else if (dateRange?.validBudgetEndDate === false) {
    validationErrors.errors['endDate'] = fieldError('projectObject.error.budgetNotIncluded');
  }

  if (values?.startDate && values?.endDate) {
    // Check that project object start date is not after end date
    if (values.startDate >= values.endDate) {
      validationErrors.errors['startDate'] = fieldError(
        'projectObject.error.endDateBeforeStartDate',
      );
      validationErrors.errors['endDate'] = fieldError('projectObject.error.endDateBeforeStartDate');
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
  userId: string,
) {
  if (hasErrors(await validateUpsertProjectObject(tx, projectObject))) {
    logger.error('Invalid project data', { input: projectObject });
    throw new Error('Invalid project data');
  }

  const data = getUpdateData(projectObject, userId);
  const idents = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);
  const upsertResultSchema = z.object({
    projectObjectId: nonEmptyString,
    projectId: nonEmptyString,
  });

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
          RETURNING id AS "projectObjectId", project_id as "projectId"
      `)
    : await tx.one(sql.type(upsertResultSchema)`
          INSERT INTO app.project_object (${sql.join(idents, sql.fragment`,`)})
          VALUES (${sql.join(values, sql.fragment`,`)})
          RETURNING id AS "projectObjectId", project_id as "projectId"
      `);

  if (projectObject.budgetUpdate?.budgetItems?.length) {
    await updateProjectObjectBudget(
      tx,
      upsertResult.projectObjectId,
      projectObject.budgetUpdate.budgetItems,
      userId,
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
      userId,
    );
  }

  return upsertResult;
}

async function updateProjectObjectGeometry(
  tx: DatabaseTransactionConnection,
  input: UpdateGeometry,
  userId: string,
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

/**
 * Permissions inherit from the project to the project object.
 */
export async function getPermissionContext(
  projectObjectId: string,
  tx?: DatabaseTransactionConnection,
): Promise<ProjectPermissionContext> {
  const conn = tx ?? getPool();
  const permissionCtx = await conn.maybeOne(sql.type(permissionContextSchema)`
    SELECT
      project.id AS id,
      "owner",
      coalesce(array_agg(project_permission.user_id) FILTER (WHERE can_write = true), '{}') AS "writeUsers"
    FROM app.project
    INNER JOIN app.project_object ON project.id = project_object.project_id
    LEFT JOIN app.project_permission ON project.id = project_permission.project_id
    WHERE project_object.id = ${projectObjectId}
    GROUP BY project.id, "owner"
  `);
  if (!permissionCtx) {
    throw new Error('Could not get permission context');
  }
  return permissionCtx;
}
/**
 * This function creates a middleware to check if a user has access to a project.
 * It takes two parameters: a TRPC instance and a function to check if a user has access to a project.
 * The function 'canAccess' should take a user and a permission context as parameters and return a boolean.
 * The middleware function returned by this function will throw a TRPCError with a 'BAD_REQUEST' code
 * if the input is not a project ID or if the user does not have access to the project.
 * If the user has access to the project, the middleware function will call the next middleware in the stack.
 *
 * @param {TRPC} t - The TRPC instance used to create the middleware.
 * @param {ProjectAccessChecker} canAccess - A function that checks if a user has access to a project.
 * @returns {Function} A middleware function that checks if a user has access to a project.
 */

export const createAccessMiddleware = (t: TRPC) => (canAccess: ProjectAccessChecker) =>
  t.middleware(async (opts) => {
    const { ctx, input, next } = opts;
    if (!isProjectObjectIdInput(input)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.invalidInput',
      });
    }
    const permissionCtx = await getPermissionContext(input.projectObjectId);
    if (!canAccess(ctx.user, permissionCtx)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'error.insufficientPermissions',
      });
    }
    return next();
  });

export const createProjectObjectRouter = (t: TRPC) => {
  const withAccess = createAccessMiddleware(t);

  return t.router({
    get: t.procedure.input(getProjectObjectParams).query(async ({ input }) => {
      return await getPool().transaction(async (tx) => {
        const projectObject = await getProjectObject(tx, input.projectObjectId);
        const permissionCtx = await getPermissionContext(input.projectObjectId, tx);
        return { ...projectObject, acl: permissionCtx };
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

    upsertValidate: t.procedure.input(z.any()).query(async ({ input }) => {
      return await getPool().connect(async (conn) => {
        return await validateUpsertProjectObject(conn, input);
      });
    }),

    // Mutations requiring write permissions / project ownership

    upsert: t.procedure.input(upsertProjectObjectSchema).mutation(async ({ input, ctx }) => {
      return await getPool().transaction(async (tx) => {
        let permissionCtx;
        if (!input.projectObjectId && input.projectId) {
          permissionCtx = await getProjectPermissionCtx(input.projectId);
        } else if (input.projectObjectId) {
          permissionCtx = await getPermissionContext(input.projectObjectId);
        } else {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.invalidInput' });
        }

        if (!hasWritePermission(ctx.user, permissionCtx) && !ownsProject(ctx.user, permissionCtx)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'error.insufficientPermissions' });
        } else {
          return await upsertProjectObject(tx, input, ctx.user.id);
        }
      });
    }),

    updateGeometry: t.procedure
      .input(updateGeometrySchema)
      .use(withAccess((usr, ctx) => ownsProject(usr, ctx) || hasWritePermission(usr, ctx)))
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectObjectGeometry(tx, input, ctx.user.id);
        });
      }),

    updateBudget: t.procedure
      .input(updateBudgetSchema.required())
      .use(
        withAccess(
          (usr, ctx) =>
            ownsProject(usr, ctx) ||
            hasWritePermission(usr, ctx) ||
            hasPermission(usr, 'financials.write'),
        ),
      )
      .mutation(async ({ input, ctx }) => {
        return await getPool().transaction(async (tx) => {
          return await updateProjectObjectBudget(
            tx,
            input.projectObjectId,
            input.budgetItems,
            ctx.user.id,
          );
        });
      }),

    delete: t.procedure
      .input(deleteProjectObjectSchema)
      .use(withAccess(ownsProject))
      .mutation(async ({ input, ctx }) => {
        const { projectObjectId } = input;
        return await deleteProjectObject(projectObjectId, ctx.user);
      }),
  });
};
