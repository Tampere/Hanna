import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';

import {
  CostEstimatesInput,
  CostEstimatesUpdate,
  Relation,
  UpdateGeometry,
  costEstimateSchema,
  projectRelationsSchema,
  relationsSchema,
  updateGeometryResultSchema,
} from '@shared/schema/project';
import { User } from '@shared/schema/user';

export async function addProjectRelation(
  projectId: string,
  targetProjectId: string,
  relation: Relation,
  user: User
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
  user: User
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
      id AS "projectId",
      project_name AS "projectName"
    FROM relations
    LEFT JOIN app.project ON "projectId" = project.id
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

export async function updateProjectGeometry(geometryUpdate: UpdateGeometry, user: User) {
  const { id, features } = geometryUpdate;
  return getPool().transaction(async (tx) => {
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
      WHERE id = ${id}
      RETURNING id, ST_AsGeoJSON(geom) AS geom
    `);
  });
}

function costEstimateWhereFragment(costEstimateInput: CostEstimatesInput) {
  const { projectId, projectObjectId, taskId } = costEstimateInput;
  const sqlFalse = sql.fragment`FALSE`;
  return sql.fragment`
    ${projectId ? sql.fragment`project_id = ${projectId}` : sqlFalse} OR
    ${projectObjectId ? sql.fragment`project_object_id = ${projectObjectId}` : sqlFalse} OR
    ${taskId ? sql.fragment`task_id = ${taskId}` : sqlFalse}
  `;
}

export async function getCostEstimates(costEstimates: CostEstimatesInput) {
  return getPool().any(sql.type(costEstimateSchema)`
    SELECT
      year,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'amount', amount
        )
      ) AS estimates
    FROM app.cost_estimate
    WHERE ${costEstimateWhereFragment(costEstimates)}
    GROUP BY year
    ORDER BY year ASC
  `);
}

export async function updateCostEstimates(updates: CostEstimatesUpdate, user: User) {
  const { projectId, projectObjectId, taskId, costEstimates } = updates;

  const newRows = costEstimates.reduce(
    (rows, item) => [
      ...rows,
      ...item.estimates
        .filter((estimate) => estimate.amount != null)
        .map((estimate) => ({ year: item.year, amount: estimate.amount! })),
    ],
    [] as { year: number; amount: number }[]
  );

  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'project.updateCostEstimates',
      eventData: updates,
      eventUser: user.id,
    });
    await tx.any(sql.untyped`
        DELETE FROM app.cost_estimate
        WHERE ${costEstimateWhereFragment(updates)}
    `);
    await Promise.all(
      newRows.map((row) =>
        tx.any(sql.untyped`
            INSERT INTO app.cost_estimate (project_id, project_object_id, task_id, year, amount)
            VALUES (
              ${projectId ?? null},
              ${projectObjectId ?? null},
              ${taskId ?? null},
              ${row.year},
              ${row.amount}
            )
          `)
      )
    );
  });
}
