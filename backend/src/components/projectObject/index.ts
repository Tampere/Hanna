import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection, ValueExpression } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { codeIdFragment } from '@backend/components/code/index.js';
import { textToSearchTerms } from '@backend/components/project/search.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { FormErrors, fieldError, hasErrors } from '@shared/formerror.js';
import { nonEmptyString } from '@shared/schema/common.js';
import {
  BudgetUpdate,
  ObjectsByProjectSearch,
  ProjectObjectSearch,
  UpdateGeometry,
  UpdateProjectObject,
  UpsertProjectObject,
  dbProjectObjectGeometrySchema,
  dbProjectObjectSchema,
  projectObjectSearchResultSchema,
  updateGeometryResultSchema,
  yearBudgetSchema,
} from '@shared/schema/projectObject.js';
import { User } from '@shared/schema/user.js';
import {
  ProjectPermissionContext,
  permissionContextSchema,
} from '@shared/schema/userPermissions.js';

const CLUSTER_ZOOM_BELOW = 10;

const projectObjectFragment = sql.fragment`
  WITH roles AS (
    SELECT json_build_object(
          'roleId', (role).id,
          'userIds', COALESCE(json_agg(user_id) FILTER (WHERE user_id IS NOT NULL), '[]'),
          'companyContactIds', COALESCE(json_agg(company_contact_id) FILTER (WHERE company_contact_id IS NOT NULL), '[]')
        ) AS "objectUserRoles", project_object.id AS project_object_id
      FROM app.project_object_user_role, app.project_object
      WHERE project_object.id = project_object_user_role.project_object_id
	    GROUP BY (role).id, project_object.id
  ), geometry_dump AS (SELECT po.id "dumpProjectObjectId", (st_dump(po.geom)).geom FROM app.project_object po)
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
     ST_AsGeoJSON(ST_CollectionExtract(project_object.geom)) AS geom,
     COALESCE(jsonb_agg(ST_AsGeoJSON(geometry_dump.geom)) FILTER (WHERE geometry_dump.geom IS NOT null), '[]'::jsonb) as "geometryDump",
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
  LEFT JOIN geometry_dump ON geometry_dump."dumpProjectObjectId" = project_object.id
  WHERE deleted = false
  GROUP BY project_object.id
`;

function getProjectObjectSearchFragment({
  projectIds,
  withRank,
  includeDeleted,
  withGeoHash,
  withProjectGeometry,
}: {
  projectIds?: string[];
  withRank?: boolean;
  includeDeleted?: boolean;
  withGeoHash?: boolean;
  withProjectGeometry?: boolean;
} = {}) {
  return sql.fragment`
  SELECT
    po.id AS "projectObjectId",
    po.start_date AS "startDate",
    po.end_date AS "endDate",
    po.object_name AS "objectName",
    (object_stage).id AS "objectStage",
    ST_AsGeoJSON(ST_CollectionExtract(po.geom)) AS geom,
    jsonb_build_object(
      'projectId', po.project_id,
      'startDate', project.start_date,
      'endDate', project.end_date,
      'projectName', project.project_name,
      'projectType', CASE WHEN (pi.id IS NULL) THEN 'detailplanProject' ELSE 'investmentProject' END,
      'detailplanId', pd.id
      ${
        withProjectGeometry
          ? sql.fragment`,'geom', ST_AsGeoJSON(ST_CollectionExtract(project.geom))`
          : sql.fragment``
      }
    ) as project
    ${withGeoHash ? sql.fragment`, po.geohash` : sql.fragment``}
    ${
      withProjectGeometry
        ? sql.fragment`, ST_AsGeoJSON(ST_CollectionExtract(project.geom)) AS "projectGeom"`
        : sql.fragment``
    }

    ${
      withRank
        ? sql.fragment`, dense_rank() OVER (ORDER BY project.project_name)::int4 AS "projectIndex"`
        : sql.fragment``
    }
  FROM app.project_object po
  INNER JOIN app.project ON po.project_id = project.id
  LEFT JOIN app.project_investment pi ON po.project_id = pi.id
  LEFT JOIN app.project_detailplan pd ON po.project_id = pd.id
  ${includeDeleted ? sql.fragment`` : sql.fragment`WHERE po.deleted = false`}
  ${
    projectIds
      ? includeDeleted
        ? sql.fragment`WHERE po.project_id = ANY(${sql.array(projectIds, 'uuid')})`
        : sql.fragment`AND po.project_id = ANY(${sql.array(projectIds, 'uuid')})`
      : sql.fragment``
  }
  `;
}

function timePeriodFragment(input: ProjectObjectSearch) {
  const startDate = input.dateRange?.startDate ?? null;
  const endDate = input.dateRange?.endDate ?? null;
  if (!startDate && !endDate) {
    return sql.fragment`true`;
  }
  return sql.fragment`
    daterange(po.start_date, po.end_date, '[]') && daterange(${startDate}, ${endDate}, '[]')
  `;
}

function zoomToGeohashLength(zoom: number) {
  if (zoom < 9) {
    return 5;
  } else if (zoom < 10) {
    return 6;
  } else {
    return 8;
  }
}

function clusterResultsFragment(zoom: number | undefined) {
  if (!zoom || zoom > CLUSTER_ZOOM_BELOW) return sql.fragment`'[]'::jsonb`;

  return sql.fragment`
    (
      SELECT jsonb_agg(clusters.*)
      FROM (
        SELECT
          jsonb_agg("projectObjectId") AS "clusterProjectObjectIds",
          substr(geohash, 1, ${zoomToGeohashLength(zoom)}) AS "clusterGeohash",
          count(*) AS "clusterCount",
          ST_AsGeoJSON(ST_Centroid(ST_Collect(geom))) AS "clusterLocation"
        FROM search_results
        GROUP BY "clusterGeohash"
    ) clusters)
  `;
}

function mapExtentFragment(input: ProjectObjectSearch) {
  const extent = input.map?.extent;
  if (!extent) return sql.fragment`true`;
  const includeWithoutGeom = input.includeWithoutGeom ? sql.fragment`true` : sql.fragment`false`;

  return sql.fragment`
    (ST_Intersects(
      po.geom,
      ST_SetSRID(
        ST_MakeBox2d(
          ST_Point(${extent[0]}, ${extent[1]}),
          ST_Point(${extent[2]}, ${extent[3]})
        ),
        3067
      )
    ) OR (${includeWithoutGeom} AND po.geom IS NULL))
  `;
}

function objectParticipantFragment(objectParticipantUser: string | null) {
  if (objectParticipantUser) {
    return sql.fragment`HAVING rakennuttaja_user = ${objectParticipantUser} OR suunnitteluttaja_user = ${objectParticipantUser} OR ${objectParticipantUser} = ANY(array_agg(pour.user_id))`;
  }
  return sql.fragment``;
}

export async function projectObjectSearch(input: ProjectObjectSearch) {
  const { map, limit = 500 } = input;
  const resultSchema = z.object({ result: projectObjectSearchResultSchema });

  const objectNameSearch = textToSearchTerms(input.projectObjectName, { minTermLength: 1 });
  const objectNameSubstringSearch =
    input.projectObjectName && input.projectObjectName?.length >= 1 ? input.projectObjectName : '';

  const {
    objectTypes = [],
    objectCategories = [],
    objectUsages = [],
    lifecycleStates = [],
    objectStages = [],
    objectParticipantUser = null,
    rakennuttajaUsers = [],
    suunnitteluttajaUsers = [],
  } = input;

  const withGeometries = Boolean(map?.zoom && map.zoom > CLUSTER_ZOOM_BELOW);

  const dbResult = await getPool().one(sql.type(resultSchema)`
    WITH search_results AS (
    ${getProjectObjectSearchFragment({
      withProjectGeometry: withGeometries,
      withRank: true,
      includeDeleted: true,
      withGeoHash: true,
    })}
    LEFT JOIN app.project_object_user_role pour ON po.id = pour.project_object_id


      WHERE po.deleted = false
      -- search date range intersection
      AND ${timePeriodFragment(input)}
      AND ${mapExtentFragment(input)}
      AND (${objectNameSearch}::text IS NULL OR to_tsquery('simple', ${objectNameSearch}) @@ to_tsvector('simple', po.object_name) OR po.object_name LIKE '%' || ${objectNameSubstringSearch} || '%')
      -- empty array means match all, otherwise check for intersection
      AND (
        ${sql.array(objectTypes, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE po.id = project_object_type.project_object_id) &&
        ${sql.array(objectTypes, 'text')}
      )
      AND (
        ${sql.array(objectCategories, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE po.id = project_object_category.project_object_id) &&
        ${sql.array(objectCategories ?? [], 'text')}
      )
      AND (
        ${sql.array(objectUsages, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE po.id = project_object_usage.project_object_id) &&
        ${sql.array(objectUsages, 'text')}
      )
      AND (
        ${sql.array(lifecycleStates, 'text')} = '{}'::TEXT[] OR
        (po.lifecycle_state).id = ANY(${sql.array(lifecycleStates, 'text')})
      )
      AND (
        ${sql.array(objectStages, 'text')} = '{}'::TEXT[] OR
        (po.object_stage).id = ANY(${sql.array(objectStages, 'text')})
      )
      AND (
        ${sql.array(rakennuttajaUsers, 'text')} = '{}'::TEXT[] OR
        po.rakennuttaja_user = ANY(${sql.array(rakennuttajaUsers, 'text')})
      )
      AND (
        ${sql.array(suunnitteluttajaUsers, 'text')} = '{}'::TEXT[] OR
        po.suunnitteluttaja_user = ANY(${sql.array(suunnitteluttajaUsers, 'text')})
      )
    GROUP BY po.id, project.project_name, pi.id, project.geom, project.start_date, project.end_date, pd.id
    ${objectParticipantFragment(objectParticipantUser)}
    LIMIT ${limit}
  ), project_object_results AS (
    SELECT
      "projectObjectId",
      "startDate",
      "endDate",
      "objectName",
      "objectStage",
      project
      ${
        withGeometries
          ? sql.fragment`, geom,
      "projectGeom"`
          : sql.fragment``
      }

    FROM search_results
    ORDER BY "projectIndex"
  ) SELECT jsonb_build_object(
      'projectObjects', (SELECT jsonb_agg(project_object_results.*) FROM project_object_results),
      'clusters', ${clusterResultsFragment(map?.zoom)}
    ) AS result
    `);

  return dbResult.result;
}

export async function getProjectObjectsByProjectSearch(
  input: ObjectsByProjectSearch,
  tx?: DatabaseTransactionConnection | null,
) {
  const { map, projectIds } = input;
  const conn = tx ?? getPool();
  const isClusterSearch = map?.zoom && map.zoom < CLUSTER_ZOOM_BELOW;
  if (isClusterSearch) return null;
  return conn.any(sql.type(projectObjectSearchResultSchema.pick({ projectObjects: true }))`
    ${getProjectObjectSearchFragment({ projectIds })}
  `);
}

export async function getProjectObjectsByProjectId(projectId: string) {
  return getPool().any(sql.type(dbProjectObjectSchema)`
    ${projectObjectFragment}
    HAVING project_id = ${projectId}
  `);
}

export async function getGeometriesByProjectId(projectId: string) {
  return getPool().any(sql.type(dbProjectObjectGeometrySchema)`
    SELECT
      ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
      id  "projectObjectId",
      object_name "objectName"
    FROM app.project_object
    WHERE project_id = ${projectId} AND deleted = false;
  `);
}

export async function deleteProjectObject(projectObjectId: string, user: User) {
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

export async function getProjectObjectBudget(projectObjectId: string) {
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
    HAVING id = ${projectObjectId}
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
    HAVING id = ANY(${sql.array(projectObjectIds, 'uuid')})
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
    WHERE project_object_id = ${values?.projectObjectId} AND (amount is NOT NULL OR forecast is NOT NULL OR kayttosuunnitelman_muutos is NOT NULL)
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
    await updateProjectObjectGeometry(
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

export async function updateProjectObjectGeometry(
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
