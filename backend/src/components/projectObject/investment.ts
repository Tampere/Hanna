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
  getProjectObjectGeometryDumpFragment,
  updateObjectCategories,
  updateObjectRoles,
  updateObjectUsages,
  updateProjectObjectBudget,
  updateProjectObjectCommittees,
  updateProjectObjectGeometry,
  validateUpsertProjectObject,
} from './index.js';

const getProjectObjectFragment = (ids: string | string[]) => sql.fragment`
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
     (poi.object_stage).id AS "objectStage",
     (poi.palm_grouping).id AS "palmGrouping",
     (SELECT (committee_type).id FROM app.project_object_committee poc WHERE project_object.id = poc.project_object_id) AS committee,
     start_date AS "startDate",
     end_date AS "endDate",
     sap_wbs_id AS "sapWBSId",
     dump.geom,
     dump.geometry_dump AS "geometryDump",
     (SELECT json_agg((object_type).id)->0
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
        'owner', (SELECT owner FROM app.project WHERE project.id = project_object.project_id)
      )
    ) AS "permissionCtx",
     (SELECT COALESCE(json_agg("objectUserRoles"), '[]') FROM roles r WHERE r.project_object_id = project_object.id) AS "objectUserRoles"
  FROM app.project_object_investment poi
  LEFT JOIN app.project_object ON project_object.id = poi.project_object_id
  LEFT JOIN dump ON dump.id = project_object.id
  WHERE deleted = false AND ${
    Array.isArray(ids)
      ? sql.fragment`poi.project_object_id = ANY(${sql.array(ids, 'uuid')})`
      : sql.fragment`poi.project_object_id = ${ids}`
  }

`;

async function updateObjectTypes(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateInvestmentProjectObject,
) {
  if (!projectObject.objectType) {
    return;
  }

  await tx.query(sql.untyped`
      DELETE FROM app.project_object_type WHERE project_object_id = ${projectObject.projectObjectId}
    `);

  await tx.any(sql.untyped`
      INSERT INTO app.project_object_type (project_object_id, object_type)
      VALUES (${projectObject.projectObjectId}, ('KohdeTyyppi', ${projectObject.objectType})::app.code_id);
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
      ${getProjectObjectFragment(projectObjectId)}
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
      ${getProjectObjectFragment(projectObjectIds)}
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
    palm_grouping:
      projectObject.palmGrouping && codeIdFragment('PalmKoritus', projectObject.palmGrouping),
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

  await updateProjectObjectCommittees(
    upsertResult.projectId,
    upsertResult.projectObjectId,
    projectObject.committee,
    tx,
  );
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

export async function deleteBudget(
  tx: DatabaseTransactionConnection,
  projectObjectId: string,
  committees: string[],
  userId: string,
) {
  await addAuditEvent(tx, {
    eventType: 'projectObject.deleteBudgetWithCommittees',
    eventData: { projectObjectId, committees },
    eventUser: userId,
  });

  return tx.any(sql.untyped`
  DELETE FROM app.budget
  WHERE project_object_id = ${projectObjectId}
  AND (committee).id = ANY(${sql.array(committees, 'text')})`);
}

export async function getProjectObjectNewProjectCandidates(
  tx: DatabaseTransactionConnection,
  projectObjectId: string,
  ownerId?: string,
) {
  const projectObject = await getProjectObject(tx, projectObjectId);

  return tx.any(sql.type(z.object({ projectId: z.string(), projectName: z.string() }))`
    SELECT p.id AS "projectId", p.project_name AS "projectName"
    FROM app.project p
    WHERE
      p.id <> ${projectObject.projectId} AND
      p.start_date <= ${projectObject.startDate} AND
      p.end_date >= ${projectObject.endDate} AND
      ${
        projectObject.committee
      } = ANY(SELECT (committee_type).id FROM app.project_committee pc WHERE pc.project_id = p.id) AND
      p.deleted = false ${ownerId ? sql.fragment`AND p.owner = ${ownerId}` : sql.fragment``}
    GROUP BY p.id
    ORDER BY p.project_name
    `);
}

export async function moveProjectObjectToProject(
  tx: DatabaseTransactionConnection,
  projectObjectId: string,
  oldProjectId: string,
  newProjectId: string,
  userId: string,
) {
  await addAuditEvent(tx, {
    eventType: 'projectObject.moveProjectObjectToProject',
    eventData: { projectObjectId, oldProjectId, newProjectId },
    eventUser: userId,
  });

  await tx.any(
    sql.untyped`
      UPDATE app.project_object_committee
      SET project_id = ${newProjectId}
      WHERE project_object_id = ${projectObjectId}`,
  );

  return tx.one(sql.type(z.object({ projectId: z.string() }))`
  UPDATE app.project_object
  SET project_id = ${newProjectId}, sap_wbs_id = NULL
  WHERE id = ${projectObjectId}
  RETURNING ${newProjectId} as "projectId"`);
}
