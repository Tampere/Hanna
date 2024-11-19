import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

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

/** @param projectObjectTableIdentifier represents table that needs to hold columns id and geom */
export function getProjectObjectGeometryDumpFragment(
  projectObjectTable: string[] = ['app', 'project_object'],
  geometryColumn: string = 'geom',
) {
  return sql.fragment`
   WITH dump AS
  	(SELECT id, (ST_Dump(${sql.identifier([geometryColumn])})).geom FROM ${sql.identifier(
      projectObjectTable,
    )}),
  geometries AS
  	(SELECT
      po.id,
      ST_AsGeoJSON(ST_Union(ST_MakeValid(d.geom, 'method=structure'))) AS geom, --MakeValid is used to fix self intersecting geometries
      COALESCE(jsonb_agg(ST_AsGeoJSON(d.geom)) FILTER (WHERE d.geom IS NOT NULL), '[]'::jsonb) as geometry_dump
  	FROM ${sql.identifier(projectObjectTable)} po
  	LEFT JOIN dump d ON d.id = po.id
  	GROUP BY po.id)
  SELECT id, geom, geometry_dump FROM geometries
  `;
}

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
    WITH dump AS (${getProjectObjectGeometryDumpFragment()})
    SELECT
      project_id AS "projectId",
      project_object.id AS "projectObjectId",
      object_name AS "objectName",
      description AS "description",
      (poi.object_stage).id AS "objectStage",
      start_date AS "startDate",
      end_date AS "endDate",
      dump.geom
    FROM app.project_object
    LEFT JOIN app.project_object_investment poi ON project_object.id = poi.project_object_id
    LEFT JOIN dump ON dump.id = project_object.id
    WHERE deleted = false AND project_id = ${projectId}
  `);
}

export async function getGeometriesByProjectId(projectId: string) {
  return getPool().any(sql.type(dbProjectObjectGeometrySchema)`
    WITH dump as (${getProjectObjectGeometryDumpFragment()})
    SELECT
      dump.geom,
      po.id  "projectObjectId",
      po.object_name "objectName"
    FROM app.project_object po
    LEFT JOIN dump ON dump.id = po.id
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
  // FlatMap needs to be used for Slonik to stay up with active query promise
  await Promise.all(
    projectObject.objectUserRoles.flatMap(({ userIds, roleId, companyContactIds, roleType }) => [
      ...userIds.map((userId) =>
        tx.any(sql.untyped`
      INSERT INTO app.project_object_user_role (user_id, project_object_id, role)
      VALUES (
        ${userId},
        ${projectObject.projectObjectId},
        ${codeIdFragment(roleType, roleId)}
      );
    `),
      ),
      ...companyContactIds.map((contactId) =>
        tx.any(sql.untyped`
      INSERT INTO app.project_object_user_role (company_contact_id, project_object_id, role)
      VALUES (
        ${contactId},
        ${projectObject.projectObjectId},
        ${codeIdFragment(roleType, roleId)}
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
      ) AS "budgetItems",
      (committee).id AS "committee"
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
      // filter falsy keys in case of partial update
      const data = Object.fromEntries(
        Object.entries({
          year: item.year,
          estimate: item.estimate,
          contract_price: item.contractPrice,
          amount: item.amount,
          forecast: item.forecast,
          kayttosuunnitelman_muutos: item.kayttosuunnitelmanMuutos,
          committee: item.committee ? `(Lautakunta,${item.committee})` : undefined,
        }).filter(([, value]) => value !== undefined),
      ) as Required<BudgetUpdate['budgetItems'][number]>;

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
      extract(year FROM ${values?.endDate}::date) >= max(budget.year) AS "validBudgetEndDate",
      CASE
        WHEN ${values?.endDate} = 'infinity'
        THEN extract(year FROM CURRENT_DATE) + 5 >= max(budget.year)
        ELSE true
      END AS "validOngoingBudgetEndDate"
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
      br."validOngoingBudgetEndDate",
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

  if (dateRange?.validBudgetStartDate === false) {
    validationErrors.errors['startDate'] = fieldError('projectObject.error.budgetNotIncluded');
  } else if (dateRange?.validProjectStartDate === false) {
    validationErrors.errors['startDate'] = fieldError('projectObject.error.projectNotIncluded');
  }

  if (dateRange?.validBudgetEndDate === false) {
    validationErrors.errors['endDate'] = fieldError('projectObject.error.budgetNotIncluded');
  } else if (dateRange?.validOngoingBudgetEndDate === false) {
    validationErrors.errors['endDate'] = fieldError(
      'projectObject.error.budgetNotIncludedForOngoing',
    );
  } else if (dateRange?.validProjectEndDate === false) {
    validationErrors.errors['endDate'] = fieldError('projectObject.error.projectNotIncluded');
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

export async function updateProjectObjectCommittees(
  projectId: string,
  projectObjectId: string,
  committeeId?: string,
  tx?: DatabaseTransactionConnection,
) {
  if (!committeeId) {
    return;
  }
  const conn = tx ?? getPool();

  await conn.query(sql.untyped`
    DELETE FROM app.project_object_committee WHERE project_object_id = ${projectObjectId}
  `);

  await conn.any(sql.untyped`
        INSERT INTO app.project_object_committee (project_id, project_object_id, committee_type)
        VALUES (${projectId}, ${projectObjectId}, ${codeIdFragment('Lautakunta', committeeId)});
      `);
}

export async function getCommitteesUsedByProjectObjects(
  projectId: string,
  tx?: DatabaseTransactionConnection,
) {
  const conn = tx ?? getPool();
  return conn.any(sql.type(z.object({ id: codeId }))`
    SELECT DISTINCT (committee_type).id AS id, (committee_type).code_list_id AS "codeListId"
    FROM app.project_object_committee
    WHERE project_id = ${projectId}
  `);
}
