import { DatabaseTransactionConnection, ValueExpression } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { hasErrors } from '@shared/formerror.js';
import { nonEmptyString } from '@shared/schema/common.js';
import {
  UpdateInvestmentProjectObject,
  UpsertInvestmentProjectObject,
  dbInvestmentProjectObjectSchema,
} from '@shared/schema/projectObject/investment.js';

import { codeIdFragment } from '../code/index.js';
import {
  updateObjectCategories,
  updateObjectRoles,
  updateObjectUsages,
  updateProjectObjectBudget,
  updateProjectObjectGeometry,
  validateUpsertProjectObject,
} from './index.js';

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
     (poi.object_stage).id AS "objectStage",
     poi.suunnitteluttaja_user AS "suunnitteluttajaUser",
     poi.rakennuttaja_user AS "rakennuttajaUser",
     start_date AS "startDate",
     end_date AS "endDate",
     sap_wbs_id AS "sapWBSId",
     ST_AsGeoJSON(ST_CollectionExtract(project_object.geom)) AS geom,
     COALESCE(jsonb_agg(ST_AsGeoJSON(geometry_dump.geom)) FILTER (WHERE geometry_dump.geom IS NOT null), '[]'::jsonb) as "geometryDump",
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
     (SELECT COALESCE(json_agg("objectUserRoles"), '[]') FROM roles r WHERE r.project_object_id = project_object.id) AS "objectUserRoles"
  FROM app.project_object_investment poi
  LEFT JOIN app.project_object ON project_object.id = poi.project_object_id
  LEFT JOIN geometry_dump ON geometry_dump."dumpProjectObjectId" = project_object.id
  WHERE deleted = false
  GROUP BY poi.project_object_id, project_object.id
`;

async function updateObjectTypes(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateInvestmentProjectObject,
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

/**
 * Fetches a single project object from the database.
 * @param {DatabaseTransactionConnection} [tx] - Databse transaction connection.
 * @param {string} projectObjectId - The ID of the project object to fetch.
 * @returns {Promise<ProjectObject>} - Returns a promise that resolves to the fetched project object.
 */

export async function getProjectObject(tx: DatabaseTransactionConnection, projectObjectId: string) {
  return tx.one(sql.type(dbInvestmentProjectObjectSchema)`
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
  return tx.many(sql.type(dbInvestmentProjectObjectSchema)`
      ${projectObjectFragment}
      HAVING id = ANY(${sql.array(projectObjectIds, 'uuid')})
    `);
}

/**
 * Returns the data to be inserted or updated in the database. Mostly renames
 * the fields to match the database column names and filters out the undefined fields
 * @param projectObject - the project object to be inserted (full data) or updated (partial)
 * @param userId - the id of the user performing the update
 * @returns the data to be inserted or updated in the database
 */

function getUpdateData(
  projectObject: UpsertInvestmentProjectObject,
  userId: string,
): {
  commonData: Record<string, ValueExpression>;
  investmentData: Record<string, ValueExpression>;
} {
  const data = {
    project_id: projectObject.projectId,
    object_name: projectObject.objectName,
    description: projectObject.description,
    lifecycle_state:
      projectObject.lifecycleState &&
      codeIdFragment('KohteenElinkaarentila', projectObject.lifecycleState),
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
  const investmentData = {
    object_stage:
      projectObject.objectStage && codeIdFragment('KohteenLaji', projectObject.objectStage),
    suunnitteluttaja_user: projectObject.suunnitteluttajaUser,
    rakennuttaja_user: projectObject.rakennuttajaUser,
  };
  // filter undefined values
  return {
    commonData: Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Record<string, ValueExpression>,
    investmentData: Object.fromEntries(
      Object.entries(investmentData).filter(([, value]) => value !== undefined),
    ) as Record<string, ValueExpression>,
  };
}

function isUpdate(input: UpsertInvestmentProjectObject): input is UpdateInvestmentProjectObject {
  return 'projectObjectId' in input;
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
  projectObject: UpsertInvestmentProjectObject,
  userId: string,
) {
  if (hasErrors(await validateUpsertProjectObject(tx, projectObject))) {
    logger.error('Invalid project data', { input: projectObject });
    throw new Error('Invalid project data');
  }

  const { commonData, investmentData } = getUpdateData(projectObject, userId);
  const commonIdents = Object.keys(commonData).map((key) => sql.identifier([key]));
  const investmentIdents = Object.keys(investmentData).map((key) => sql.identifier([key]));
  const commonValues = Object.values(commonData);
  const investmentValues = Object.values(investmentData);

  const upsertResultSchema = z.object({
    projectObjectId: nonEmptyString,
    projectId: nonEmptyString,
  });
  await addAuditEvent(tx, {
    eventType: 'investmentProjectObject.upsert',
    eventData: projectObject,
    eventUser: userId,
  });

  const upsertResult = isUpdate(projectObject)
    ? await tx.one(sql.type(upsertResultSchema)`
            UPDATE app.project_object
            SET (${sql.join(commonIdents, sql.fragment`,`)}) = ROW(${sql.join(
              commonValues,
              sql.fragment`,`,
            )})
            WHERE id = ${projectObject.projectObjectId}
            RETURNING id AS "projectObjectId", project_id as "projectId"
        `)
    : await tx.one(sql.type(upsertResultSchema)`
            INSERT INTO app.project_object (${sql.join(commonIdents, sql.fragment`,`)})
            VALUES (${sql.join(commonValues, sql.fragment`,`)})
            RETURNING id AS "projectObjectId", project_id as "projectId"
        `);

  if (isUpdate(projectObject) && investmentIdents.length > 0) {
    await tx.query(sql.untyped`
  UPDATE app.project_object_investment
    SET (${sql.join(investmentIdents, sql.fragment`,`)}) = ROW(${sql.join(
      investmentValues,
      sql.fragment`,`,
    )})
  WHERE project_object_id = ${projectObject.projectObjectId}`);
  } else if (!isUpdate(projectObject)) {
    await tx.query(sql.untyped`
   INSERT INTO app.project_object_investment (${sql.join(
     [sql.identifier(['project_object_id']), ...investmentIdents],
     sql.fragment`,`,
   )})
    VALUES (${sql.join([upsertResult.projectObjectId, ...investmentValues], sql.fragment`,`)})
    `);
  }

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
