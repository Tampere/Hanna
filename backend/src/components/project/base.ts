import { TRPCError } from '@trpc/server';
import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { FormErrors, fieldError, hasErrors } from '@shared/formerror.js';
import { codeSchema } from '@shared/schema/code.js';
import {
  ProjectPermissions,
  UpsertProject,
  projectIdSchema,
  projectWritePermissionSchema,
} from '@shared/schema/project/base.js';
import { projectTypeSchema } from '@shared/schema/project/type.js';
import { User } from '@shared/schema/user.js';
import {
  ProjectPermissionContext,
  permissionContextSchema,
} from '@shared/schema/userPermissions.js';

import { codeIdFragment } from '../code/index.js';

/** @param projectTableIdentifier represents table that needs to hold columns id and geom */
export function getProjectGeometryDumpFragment(
  projectTableIdentifier: string[] = ['app', 'project'],
  geometryColumn: string = 'geom',
) {
  return sql.fragment`
   WITH dump AS
  	(SELECT id, (ST_Dump(${sql.identifier([geometryColumn])})).geom FROM ${sql.identifier(
      projectTableIdentifier,
    )}),
  geometries AS
  	(SELECT
      p.id,
      ST_AsGeoJSON(ST_Union(ST_MakeValid(d.geom, 'method=structure'))) AS geom, --MakeValid is used to fix self intersecting geometries
      COALESCE(jsonb_agg(ST_AsGeoJSON(d.geom)) FILTER (WHERE d.geom IS NOT NULL), '[]'::jsonb) as geometry_dump
  	FROM ${sql.identifier(projectTableIdentifier)} p
  	LEFT JOIN dump d ON d.id = p.id
  	GROUP BY p.id)
  SELECT id, geom, geometry_dump FROM geometries
  `;
}

async function upsertBaseProject(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  userId: string,
) {
  const data = {
    project_name: project.projectName,
    description: project.description,
    start_date: project.startDate,
    end_date: project.endDate,
    lifecycle_state: codeIdFragment('HankkeenElinkaarentila', project.lifecycleState),
    owner: project.owner,
    sap_project_id: project.sapProjectId,
    updated_by: userId,
    covers_entire_municipality: project.coversMunicipality,
  };

  const identifiers = Object.keys(data).map((key) => sql.identifier([key]));
  const values = Object.values(data);

  if (project.projectId && project.geom === null && data.covers_entire_municipality) {
    await tx.one(sql.type(projectIdSchema)`
    UPDATE app.project SET geom = null WHERE id = ${project.projectId} RETURNING id as "projectId"`);
  }

  const upsertResult = project.projectId
    ? await tx.one(sql.type(projectIdSchema)`
      UPDATE app.project
      SET (${sql.join(identifiers, sql.fragment`,`)}) = (${sql.join(values, sql.fragment`,`)})
      WHERE id = ${project.projectId}
      RETURNING id AS "projectId"
    `)
    : await tx.one(sql.type(projectIdSchema)`
      INSERT INTO app.project (${sql.join(identifiers, sql.fragment`,`)})
      VALUES (${sql.join(values, sql.fragment`,`)})
      RETURNING id AS "projectId"
    `);

  return upsertResult;
}

export async function getPermissionContext(
  id: string,
  tx?: DatabaseTransactionConnection,
): Promise<ProjectPermissionContext> {
  const conn = tx ?? getPool();
  const permissionCtx = await conn.maybeOne(sql.type(permissionContextSchema)`
    SELECT
      id,
      "owner",
      coalesce(array_agg(project_permission.user_id) FILTER (WHERE can_write = true), '{}') AS "writeUsers"
    FROM app.project
    LEFT JOIN app.project_permission ON project.id = project_permission.project_id
    WHERE project.id = ${id}
    GROUP BY id, "owner"
  `);
  if (!permissionCtx) {
    throw new Error('Could not get permission context');
  }
  return permissionCtx;
}

export async function getProject(id: string) {
  const project = await getPool().maybeOne(sql.type(
    z.object({
      projectId: z.string(),
      description: z.string(),
      projectName: z.string(),
      geom: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      projectType: projectTypeSchema,
      coversMunicipality: z.boolean(),
    }),
  )`
    WITH dump AS (
      ${getProjectGeometryDumpFragment()}
      )
    SELECT
      app.project.id AS "projectId",
      description,
      project_name AS "projectName",
      dump.geom,
      start_date AS "startDate",
      end_date AS "endDate",
      covers_entire_municipality AS "coversMunicipality",
      CASE
        WHEN project_investment.id IS NOT NULL THEN 'investmentProject'
        WHEN project_detailplan.id IS NOT NULL THEN 'detailplanProject'
        WHEN project_maintenance.id IS NOT NULL THEN 'maintenanceProject'
      END AS "projectType"
    FROM app.project
    LEFT JOIN app.project_investment ON project_investment.id = app.project.id
    LEFT JOIN app.project_detailplan ON project_detailplan.id = app.project.id
    LEFT JOIN app.project_maintenance ON project_maintenance.id = app.project.id
    LEFT JOIN dump ON dump.id = app.project.id
    WHERE app.project.id = ${id}
      AND deleted = false
  `);
  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }
  return project;
}

export async function deleteProject(id: string, userId: User['id']) {
  return await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, { eventType: 'deleteProject', eventData: { id }, eventUser: userId });
    const project = await tx.maybeOne(sql.type(projectIdSchema)`
      UPDATE app.project SET deleted = true WHERE id = ${id} RETURNING id as "projectId"
    `);
    if (!project) {
      throw new TRPCError({
        code: 'NOT_FOUND',
      });
    }
    const projectObjects = await tx.any(sql.type(projectIdSchema)`
    UPDATE app.project_object SET deleted = true WHERE project_id = ${id} `);

    return { project, projectObjects };
  });
}

export async function validateUpsertProject(
  tx: DatabaseTransactionConnection,
  values: UpsertProject,
) {
  const validationErrors: FormErrors<UpsertProject> = {
    errors: {},
  };

  const conn = tx ?? getPool();

  if (values?.projectId) {
    const dateRange = await conn.maybeOne(sql.untyped`
    WITH budget_range AS (
      SELECT
        ${values?.projectId} as id,
        extract(year FROM ${values?.startDate}::date) <= min(b.year) AS "validBudgetStartDate",
        extract(year FROM ${values?.endDate}::date) >= max(b.year) AS "validBudgetEndDate",
        CASE
          WHEN ${values?.endDate} = 'infinity'
            THEN GREATEST(extract(year FROM CURRENT_DATE), extract(year FROM ${values.startDate}::date)) + 5 >= max(b.year)
          ELSE true
        END AS "validOngoingBudgetEndDate"
      FROM app.budget b
      WHERE b.project_id = ${values?.projectId} AND (estimate IS NOT NULL OR amount is NOT NULL OR forecast is NOT NULL OR kayttosuunnitelman_muutos is NOT NULL)
      GROUP BY b.project_id
    ), object_range AS (
      SELECT
        ${values?.projectId} as id,
        min(po.start_date) >= ${values?.startDate} AS "validObjectStartDate",
        max(po.end_date) <= ${values?.endDate} AS "validObjectEndDate"
      FROM app.project_object po
      WHERE po.project_id = ${values?.projectId} AND po.deleted = false
      GROUP BY po.project_id
    )
    SELECT
      br."validBudgetStartDate",
      br."validBudgetEndDate",
      br."validOngoingBudgetEndDate",
      obr."validObjectStartDate",
      obr."validObjectEndDate"
    FROM object_range obr
	  FULL JOIN budget_range br ON obr.id = br.id;
  `);

    if (dateRange?.validObjectStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('project.error.objectNotIncluded');
    } else if (dateRange?.validBudgetStartDate === false) {
      validationErrors.errors['startDate'] = fieldError('project.error.budgetNotIncluded');
    }

    if (dateRange?.validObjectEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('project.error.objectNotIncluded');
    } else if (dateRange?.validBudgetEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('project.error.budgetNotIncluded');
    } else if (dateRange?.validOngoingBudgetEndDate === false) {
      validationErrors.errors['endDate'] = fieldError('project.error.budgetNotIncludedForOngoing');
    }
  }

  if (values?.startDate && values?.endDate) {
    // Check that project start date is not after end date
    if (values.startDate >= values.endDate) {
      validationErrors.errors['startDate'] = fieldError('project.error.endDateBeforeStartDate');
      validationErrors.errors['endDate'] = fieldError('project.error.endDateBeforeStartDate');
    }
  }

  // Check that SAP project ID is not changed if project has project objects
  // with selected SAP WBS elements
  if (values?.projectId) {
    const result = await conn.maybeOne(sql.untyped`
      SELECT
        project.id AS "projectId",
        sap_project.sap_project_id AS "sapProjectId",
        jsonb_agg(project_object.sap_wbs_id) FILTER (WHERE sap_wbs_id IS NOT NULL) AS "projectObjectWBSIds"
      FROM app.project
      LEFT JOIN app.sap_project ON project.sap_project_id = sap_project.sap_project_id
      LEFT JOIN app.project_object ON project.id = project_object.project_id
      WHERE project.id = ${values?.projectId} AND project_object.deleted = false
      GROUP BY project.id, sap_project.sap_project_id;
    `);

    if (
      result?.sapProjectId &&
      result?.sapProjectId !== values?.sapProjectId &&
      result?.projectObjectWBSIds?.length > 0
    ) {
      validationErrors.errors['sapProjectId'] = fieldError(
        'project.error.existingProjectObjectWBS',
      );
    }
  }

  return validationErrors;
}

async function upsertProjectPermissions(
  tx: DatabaseTransactionConnection,
  projectPermissions: ProjectPermissions,
) {
  const { projectId, permissions } = projectPermissions;

  return await tx.many(sql.type(projectIdSchema)`
    INSERT INTO app.project_permission (project_id, user_id, can_write)
    SELECT * FROM ${sql.unnest(
      permissions.map((permission) => [projectId, permission.userId, permission.canWrite]),
      ['uuid', 'text', 'bool'],
    )}
    ON CONFLICT (project_id, user_id) DO
    UPDATE SET (project_id, user_id, can_write) = (EXCLUDED.project_id, EXCLUDED.user_id, EXCLUDED.can_write)
    RETURNING project_id as "projectId";
  `);
}

export async function baseProjectUpsert(
  tx: DatabaseTransactionConnection,
  project: UpsertProject,
  user: User,
  keepOwnerRights: boolean = false,
) {
  if (hasErrors(await validateUpsertProject(tx, project))) {
    logger.error('Invalid project data', { input: project });
    throw new Error('Invalid project data');
  }

  if (keepOwnerRights && project.projectId) {
    const oldOwnerRow = await tx.one(
      sql.type(
        z.object({ owner: z.string() }),
      )`SELECT owner FROM app.project WHERE id = ${project.projectId}`,
    );

    await projectPermissionUpsert(
      {
        projectId: project.projectId,
        permissions: [{ userId: oldOwnerRow.owner, canWrite: true }],
      },
      user.id,
      tx,
    );
  }

  const result = await upsertBaseProject(tx, project, user.id);
  return result.projectId;
}

export async function projectPermissionUpsert(
  projectPermissions: ProjectPermissions,
  userId: string,
  tx?: DatabaseTransactionConnection,
) {
  const conn = tx ?? getPool();

  await addAuditEvent(conn, {
    eventType: 'projectPermission.upsert',
    eventData: projectPermissions,
    eventUser: userId,
  });
  const result = await upsertProjectPermissions(conn, projectPermissions);

  return result;
}

export async function getProjectUserPermissions(projectId: string, withAdmins: boolean = true) {
  return getPool().many(sql.type(projectWritePermissionSchema)`
  SELECT
    u.id as "userId",
    u.name as "userName",
    COALESCE(pp.can_write, false) as "canWrite",
    (u.role IS NOT NULL AND u.role = 'Hanna.Admin') as "isAdmin"
  FROM app.user u
  LEFT JOIN app.project p ON p.owner = u.id AND p.id = ${projectId}
  LEFT JOIN app.project_permission pp ON u.id = pp.user_id AND pp.project_id = ${projectId}
  ${
    withAdmins
      ? sql.fragment``
      : sql.fragment`WHERE p.owner = u.id OR (u.role IS NULL OR u.role <> 'Hanna.Admin')`
  }
  ORDER BY CASE
            WHEN u.id = p.owner THEN 1
            WHEN COALESCE(pp.can_write, false) = true THEN 2
           END, u.name
  ;`);
}

export async function getProjectCommitteesWithCodes(projectId: string) {
  return getPool().many(sql.type(codeSchema.extend({ projectId: z.string() }))`
  SELECT
    project_id AS "projectId",
    json_build_object(
      'codeListId', (committee_type).code_list_id,
      'id', (committee_type).id
    ) AS id,
    json_build_object(
      'fi', text_fi,
      'en', text_en
    ) AS text
  FROM app.project_committee pc
  LEFT JOIN app.code c ON pc.committee_type = c.id
  WHERE pc.project_id = ${projectId}`);
}

export async function shiftProjectDateRange(
  tx: DatabaseTransactionConnection,
  projectId: string,
  yearShift: number,
) {
  return tx.query(sql.untyped`
    UPDATE app.project
    SET start_date = start_date + ${sql.interval({ years: yearShift })},
        end_date = end_date + ${sql.interval({ years: yearShift })}
    WHERE id = ${projectId}
  `);
}

export async function shiftProjectBudgetDate(
  tx: DatabaseTransactionConnection,
  projectId: string,
  yearShift: number,
) {
  return tx.query(sql.untyped`
    UPDATE app.budget
    SET year = year + ${yearShift}
    WHERE project_id = ${projectId}
  `);
}
