import { DatabaseTransactionConnection } from 'slonik';

import { addAuditEvent } from '@backend/components/audit.js';
import { getPool, sql } from '@backend/db.js';

import {
  BudgetUpdate,
  Relation,
  UpdateGeometry,
  projectRelationsSchema,
  relationsSchema,
  updateGeometryResultSchema,
  yearBudgetSchema,
} from '@shared/schema/project/index.js';
import { User } from '@shared/schema/user.js';

export async function addProjectRelation(
  projectId: string,
  targetProjectId: string,
  relation: Relation,
  user: User,
) {
  let projectRelation = '';
  let subjectProject = projectId;
  let objectProject = targetProjectId;
  /**
    DB knows only two relation types: 'is_parent_of' and 'relates_to'
    If the relation to be added is 'parent' -relation, then the project to which the relation is targeted on on the UI
    (the object project) is to be switched to subject of the relation and the initial project which was modified is now the object
   */
  if (relation === 'parent') {
    projectRelation = 'is_parent_of';
    subjectProject = targetProjectId;
    objectProject = projectId;
  } else if (relation === 'child') {
    projectRelation = 'is_parent_of';
  } else {
    projectRelation = 'relates_to';
  }
  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'project.updateRelations',
      eventData: { projectId, targetProjectId, relation },
      eventUser: user.id,
    });
    await tx.any(sql.type(relationsSchema)`
      INSERT INTO app.project_relation (project_id, target_project_id, relation_type)
      VALUES (${subjectProject}, ${objectProject}, ${projectRelation});
    `);
  });
}

export async function removeProjectRelation(
  projectId: string,
  targetProjectId: string,
  relation: Relation,
  user: User,
) {
  let projectRelation = '';
  let subjectProject = projectId;
  let objectProject = targetProjectId;
  if (relation === 'parent') {
    projectRelation = 'is_parent_of';
    subjectProject = targetProjectId;
    objectProject = projectId;
  } else if (relation === 'child') {
    projectRelation = 'is_parent_of';
  } else {
    projectRelation = 'relates_to';
  }
  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'project.removeRelation',
      eventData: { projectId, targetProjectId, relation },
      eventUser: user.id,
    });
    await tx.any(sql.type(relationsSchema)`
      DELETE FROM app.project_relation
      WHERE project_id = ${subjectProject} AND target_project_id = ${objectProject} AND relation_type = ${projectRelation}
      OR project_id = ${objectProject} AND target_project_id = ${subjectProject} AND relation_type = ${projectRelation}
    `);
  });
}

export async function getRelatedProjects(id: string) {
  return getPool().one(sql.type(projectRelationsSchema)`WITH relations AS (
    (SELECT
      'child' AS relation,
      target_project_id AS "projectId"
      FROM app.project_relation
      WHERE project_id = ${id} AND relation_type = 'is_parent_of')
    UNION
    (SELECT
      'related' AS relation,
      target_project_id AS "projectId"
      FROM app.project_relation
      WHERE project_id = ${id} AND relation_type = 'relates_to')
    UNION
    (SELECT
      'related' AS relation,
      project_id AS "projectId"
      FROM app.project_relation
      WHERE target_project_id = ${id} AND relation_type = 'relates_to')
    UNION
    (SELECT
      'parent' AS relation,
      project_id AS "projectId"
      FROM app.project_relation
      WHERE target_project_id = ${id} AND relation_type = 'is_parent_of')
  ),

  related_projects AS (
    SELECT
      relation,
      project.id AS "projectId",
      project_name AS "projectName",
      CASE WHEN (pi.id IS NULL) THEN 'detailplanProject' ELSE 'investmentProject' END as "projectType"
    FROM relations
    LEFT JOIN app.project ON "projectId" = project.id
    LEFT JOIN app.project_investment pi ON "projectId" = pi.id
    WHERE deleted = false
  )

  SELECT
    jsonb_build_object(
      'children', json_agg(related_projects) FILTER (WHERE relation = 'child'),
      'parents', json_agg(related_projects) FILTER (WHERE relation = 'parent'),
      'related', json_agg(related_projects) FILTER (WHERE relation = 'related')
    ) AS relations
  FROM related_projects`);
}

export async function updateProjectGeometry(
  tx: DatabaseTransactionConnection,
  geometryUpdate: UpdateGeometry,
  user: User,
) {
  const { projectId: id, features } = geometryUpdate;
  await addAuditEvent(tx, {
    eventType: 'project.updateGeometry',
    eventData: geometryUpdate,
    eventUser: user.id,
  });
  return tx.one(sql.type(updateGeometryResultSchema)`
    WITH featureCollection AS (
      SELECT ST_Collect(
        ST_GeomFromGeoJSON(value->'geometry')
      ) AS resultGeom
      FROM jsonb_array_elements(${features}::jsonb)
    )
    UPDATE app.project
    SET geom = featureCollection.resultGeom
    FROM featureCollection
    WHERE id = ${id} AND ${id} IN (SELECT id FROM app.project_investment UNION SELECT id FROM app.project_maintenance)
    RETURNING id as "projectId", ST_AsGeoJSON(geom) AS geom
  `);
}

export async function getProjectBudget(projectId: string) {
  return getPool().any(sql.type(yearBudgetSchema)`
    WITH project_budget AS (
      SELECT
        "year",
        estimate
      FROM app.budget
      WHERE project_id = ${projectId}
    ), project_object_budget AS (
      SELECT
        year,
        sum(amount) AS amount,
        sum(forecast) AS forecast,
        sum(kayttosuunnitelman_muutos) AS kayttosuunnitelman_muutos
      FROM app.budget
      WHERE project_object_id IN (SELECT id FROM app.project_object WHERE project_id = ${projectId} AND deleted = false)
      GROUP BY "year"
    )
    SELECT
      coalesce(project_budget.year, project_object_budget.year) AS "year",
      jsonb_build_object(
        'estimate', project_budget.estimate,
        'amount', project_object_budget.amount,
        'forecast', project_object_budget.forecast,
        'kayttosuunnitelmanMuutos', project_object_budget.kayttosuunnitelman_muutos
      ) AS "budgetItems"
    FROM project_budget
    FULL OUTER JOIN project_object_budget ON project_budget.year = project_object_budget.year
    ORDER BY "year" ASC
  `);
}

export async function updateProjectBudget(
  tx: DatabaseTransactionConnection,
  projectId: string,
  budgetItems: BudgetUpdate['budgetItems'],
  userId: User['id'],
) {
  await addAuditEvent(tx, {
    eventType: 'project.updateBudget',
    eventData: { projectId, budgetItems },
    eventUser: userId,
  });

  await tx.any(sql.untyped`
    DELETE FROM app.budget
    WHERE project_id = ${projectId}
      AND year = ANY (${sql.array(
        budgetItems.map((budgetItem) => budgetItem.year),
        'int4',
      )})
  `);

  await tx.any(sql.untyped`
    INSERT INTO app.budget (project_id, "year", estimate)
    SELECT * FROM ${sql.unnest(
      budgetItems.map((row) => [projectId, row.year, row.estimate]),
      ['uuid', 'int4', 'int8'],
    )}
  `);
}
