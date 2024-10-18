import { DatabaseTransactionConnection, ValueExpression } from 'slonik';
import { z } from 'zod';

import { sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';
import { parseOptionalString } from '@backend/utils.js';

import { hasErrors } from '@shared/formerror.js';
import { nonEmptyString } from '@shared/schema/common.js';
import {
  UpdateMaintenanceProjectObject,
  UpsertMaintenanceProjectObject,
  dbMaintenanceProjectObjectSchema,
} from '@shared/schema/projectObject/maintenance.js';

import { addAuditEvent } from '../audit.js';
import { codeIdFragment } from '../code/index.js';
import {
  getProjectObjectGeometryDumpFragment,
  updateObjectCategories,
  updateObjectRoles,
  updateObjectUsages,
  updateProjectObjectBudget,
  updateProjectObjectGeometry,
  validateUpsertProjectObject,
} from './index.js';

const getProjectObjectFragment = (id: string) => sql.fragment`
  WITH roles AS (
    SELECT json_build_object(
          'roleId', (role).id,
          'roleType', (role).code_list_id,
          'userIds', COALESCE(json_agg(user_id) FILTER (WHERE user_id IS NOT NULL), '[]'),
          'companyContactIds', COALESCE(json_agg(company_contact_id) FILTER (WHERE company_contact_id IS NOT NULL), '[]')
        ) AS "objectUserRoles", project_object.id AS project_object_id
      FROM app.project_object_user_role, app.project_object
      WHERE project_object.id = project_object_user_role.project_object_id
	    GROUP BY (role).code_list_id, (role).id, project_object.id
  ), dump AS (${getProjectObjectGeometryDumpFragment()})
  SELECT
     project_id AS "projectId",
     project_object.id AS "projectObjectId",
     object_name AS "objectName",
     description AS "description",
     (lifecycle_state).id AS "lifecycleState",
     start_date AS "startDate",
     end_date AS "endDate",
     sap_wbs_id AS "sapWBSId",
     dump.geom,
     dump.geometry_dump AS "geometryDump",
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
     pom.contract,
     pom.purchase_order_number AS "poNumber",
     (pom.procurement_method).id AS "procurementMethod"
  FROM app.project_object_maintenance pom
  LEFT JOIN app.project_object ON project_object.id = pom.project_object_id
  LEFT JOIN dump ON dump.id = project_object.id
  WHERE deleted = false AND pom.project_object_id = ${id}
`;

/**
 * Fetches a single project object from the database.
 * @param {DatabaseTransactionConnection} [tx] - Databse transaction connection.
 * @param {string} projectObjectId - The ID of the project object to fetch.
 * @returns {Promise<ProjectObject>} - Returns a promise that resolves to the fetched project object.
 */

export async function getProjectObject(tx: DatabaseTransactionConnection, projectObjectId: string) {
  return tx.one(sql.type(dbMaintenanceProjectObjectSchema)`
      ${getProjectObjectFragment(projectObjectId)}

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
  projectObject: UpsertMaintenanceProjectObject,
  userId: string,
): {
  commonData: Record<string, ValueExpression>;
  maintenanceData: Record<string, ValueExpression>;
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
    updated_by: userId,
  };

  const maintenanceData = {
    contract: parseOptionalString(projectObject.contract),
    purchase_order_number: parseOptionalString(projectObject.poNumber),
    procurement_method:
      projectObject.procurementMethod &&
      codeIdFragment('KohteenToteutustapa', projectObject.procurementMethod),
  };

  // filter undefined values
  return {
    commonData: Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Record<string, ValueExpression>,
    maintenanceData: Object.fromEntries(
      Object.entries(maintenanceData).filter(([, value]) => value !== undefined),
    ) as Record<string, ValueExpression>,
  };
}

function isUpdate(input: UpsertMaintenanceProjectObject): input is UpsertMaintenanceProjectObject {
  return 'projectObjectId' in input;
}

export async function upsertProjectObject(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateMaintenanceProjectObject,
  userId: string,
) {
  if (hasErrors(await validateUpsertProjectObject(tx, projectObject))) {
    logger.error('Invalid project data', { input: projectObject });
    throw new Error('Invalid project data');
  }

  const { maintenanceData, commonData } = getUpdateData(projectObject, userId);
  const commonIdents = Object.keys(commonData).map((key) => sql.identifier([key]));
  const maintenanceIdents = Object.keys(maintenanceData).map((key) => sql.identifier([key]));
  const commonValues = Object.values(commonData);
  const maintenanceValues = Object.values(maintenanceData);
  const upsertResultSchema = z.object({
    projectObjectId: nonEmptyString,
    projectId: nonEmptyString,
  });
  await addAuditEvent(tx, {
    eventType: 'maintenanceProjectObject.upsert',
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

  if (isUpdate(projectObject) && maintenanceIdents.length > 0) {
    await tx.query(sql.untyped`
    UPDATE app.project_object_maintenance
    SET
    (${sql.join(maintenanceIdents, sql.fragment`,`)}) = ROW(${sql.join(
      maintenanceValues,
      sql.fragment`,`,
    )})
    WHERE project_object_id = ${projectObject.projectObjectId}`);
  } else {
    await tx.query(sql.untyped`
     INSERT INTO app.project_object_maintenance (${sql.join(
       [sql.identifier(['project_object_id']), ...maintenanceIdents],
       sql.fragment`,`,
     )})
    VALUES (${sql.join([upsertResult.projectObjectId, ...maintenanceValues], sql.fragment`,`)})
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
