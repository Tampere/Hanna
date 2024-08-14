import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';

import { addAuditEvent } from '@backend/components/audit.js';
import { codeIdFragment } from '@backend/components/code/index.js';
import { getPool, sql } from '@backend/db.js';

import { dbProjectObjectGeometrySchema } from '@shared//schema/projectObject/index.js';
import {
  UpdateInvestmentProjectObject,
  UpsertInvestmentProjectObject,
} from '@shared//schema/projectObject/investment.js';
import {
  UpdateMaintenanceProjectObject,
  UpsertMaintenanceProjectObject,
} from '@shared//schema/projectObject/maintenance.js';
import { FormErrors, fieldError } from '@shared/formerror.js';
import { codeId } from '@shared/schema/code.js';
import {
  BudgetUpdate,
  UpdateGeometry,
  commonDbProjectObjectSchema,
  updateGeometryResultSchema,
  yearBudgetSchema,
} from '@shared/schema/projectObject/base.js';
import { ProjectObjectSearch } from '@shared/schema/projectObject/search.js';
import { User } from '@shared/schema/user.js';
import {
  ProjectPermissionContext,
  permissionContextSchema,
} from '@shared/schema/userPermissions.js';

export function timePeriodFragment(input: ProjectObjectSearch) {
  const startDate = input.dateRange?.startDate ?? null;
  const endDate = input.dateRange?.endDate ?? null;
  if (!startDate && !endDate) {
    return sql.fragment`true`;
  }
  return sql.fragment`
    daterange(po.start_date, po.end_date, '[]') && daterange(${startDate}, ${endDate}, '[]')
  `;
}

export async function deleteProjectObject(projectObjectId: string, user: User) {
  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'projectObject.delete',
      eventData: { projectObjectId },
      eventUser: user.id,
    });
    const projectObject = await tx.maybeOne(sql.type(commonDbProjectObjectSchema)`
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

export async function getProjectObjectsByProjectId(projectId: string) {
  return getPool().any(sql.type(commonDbProjectObjectSchema.extend({ objectStage: codeId }))`
    SELECT
      project_id AS "projectId",
      id AS "projectObjectId",
      object_name AS "objectName",
      description AS "description",
      (poi.object_stage).id AS "objectStage",
      start_date AS "startDate",
      end_date AS "endDate"
    FROM app.project_object
    LEFT JOIN app.project_object_investment poi ON project_object.id = poi.project_object_id
    WHERE deleted = false AND project_id = ${projectId}
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

export async function updateObjectCategories(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateInvestmentProjectObject | UpdateMaintenanceProjectObject,
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

export async function updateObjectUsages(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateInvestmentProjectObject | UpdateMaintenanceProjectObject,
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

export async function updateObjectRoles(
  tx: DatabaseTransactionConnection,
  projectObject: UpdateInvestmentProjectObject | UpdateMaintenanceProjectObject,
) {
  if (!Array.isArray(projectObject.objectUserRoles)) {
    return;
  }

  await tx.query(sql.untyped`
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
        'estimate', estimate,
        'contractPrice', contract_price,
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
          estimate: item.estimate,
          contract_price: item.contractPrice,
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

export async function validateUpsertProjectObject(
  tx: DatabaseTransactionConnection,
  values: UpsertInvestmentProjectObject | UpsertMaintenanceProjectObject,
) {
  const validationErrors: FormErrors<
    UpsertInvestmentProjectObject | UpsertMaintenanceProjectObject
  > = { errors: {} };

  let dateRange;
  if (values?.projectObjectId && values?.startDate && values?.endDate) {
    dateRange = await tx.maybeOne(sql.untyped`
    WITH budget_range AS (
    SELECT
      ${values.projectObjectId} as id,
      extract(year FROM ${values?.startDate}::date) <= min(budget.year) AS "validBudgetStartDate",
      extract(year FROM ${values?.endDate}::date) >= max(budget.year) AS "validBudgetEndDate"
    FROM app.budget
    WHERE project_object_id = ${values?.projectObjectId} AND (
      estimate is NOT NULL or
      contract_price IS NOT NULL or
      amount is NOT NULL or
      forecast is NOT NULL or
      kayttosuunnitelman_muutos is NOT NULL)
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
