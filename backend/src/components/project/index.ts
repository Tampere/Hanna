import { DatabaseTransactionConnection } from 'slonik';

import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';

import {
  BudgetInput,
  BudgetUpdate,
  PartialBudgetUpdate,
  Relation,
  UpdateGeometry,
  YearBudget,
  projectRelationsSchema,
  relationsSchema,
  updateGeometryResultSchema,
  yearBudgetSchema,
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
      WHERE id = ${id} AND ${id} IN (SELECT id FROM app.project_investment)
      RETURNING id, ST_AsGeoJSON(geom) AS geom
    `);
  });
}

function budgetWhereFragment(budgetInput: BudgetInput) {
  const { projectId, projectObjectId, taskId } = budgetInput;
  const sqlFalse = sql.fragment`FALSE`;
  return sql.fragment`
    ${projectId ? sql.fragment`project_id = ${projectId}` : sqlFalse} OR
    ${projectObjectId ? sql.fragment`project_object_id = ${projectObjectId}` : sqlFalse} OR
    ${taskId ? sql.fragment`task_id = ${taskId}` : sqlFalse}
  `;
}

/**
 * Function to get the budget of a project / project object / task.
 * @param {BudgetInput} budgetInput - The input parameters to get the budget.
 * @returns {Promise} A promise that resolves with the budget information.
 */

export async function getBudget(budgetInput: BudgetInput) {
  return getPool().any(sql.type(yearBudgetSchema)`
    SELECT
      year,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'amount', amount
        )
      ) AS "budgetItems"
    FROM app.budget
    WHERE ${budgetWhereFragment(budgetInput)}
    GROUP BY year
    ORDER BY year ASC
  `);
}

/**
 * Function to update the budget of a project / project object / task.
 * @param {BudgetUpdate} updates - The updates to be made to the budget.
 * @param {User} user - The user making the update.
 * @returns {Promise} A promise that resolves when the update is complete.
 */

export async function updateBudget(updates: BudgetUpdate, user: User) {
  const { projectId, projectObjectId, taskId, yearBudgets } = updates;

  const newRows = yearBudgets.reduce(
    (rows, item) => [
      ...rows,
      ...item.budgetItems
        .filter((yearBudget) => yearBudget.amount != null)
        .map((yearBudget) => ({ year: item.year, amount: yearBudget.amount! })),
    ],
    [] as { year: number; amount: number }[]
  );

  await getPool().transaction(async (tx) => {
    await addAuditEvent(tx, {
      eventType: 'project.updateBudget',
      eventData: updates,
      eventUser: user.id,
    });
    await tx.any(sql.untyped`
        DELETE FROM app.budget
        WHERE ${budgetWhereFragment(updates)}
    `);
    await Promise.all(
      newRows.map((row) =>
        tx.any(sql.untyped`
            INSERT INTO app.budget (project_id, project_object_id, task_id, year, amount)
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

/**
 * Function to partial update some of the budget of a project / project object / task.
 * @param {DatabaseTransactionConnection} tx - The database transaction connection.
 * @param {BudgetUpdate} update - The updates to be made to the budget.
 * @param {User} userId - The user making the update.
 * @returns {Promise} A promise that resolves when the update is complete.
 */

export async function partialUpdateBudget(
  tx: DatabaseTransactionConnection,
  update: PartialBudgetUpdate,
  userId: User['id']
) {
  const { projectId, projectObjectId, taskId } = update;

  await addAuditEvent(tx, {
    eventType: 'project.partialUpdateBudget',
    eventData: update,
    eventUser: userId,
  });

  await tx.any(sql.untyped`
    DELETE FROM app.budget
    WHERE (${budgetWhereFragment(update)})
      AND year = ANY (${sql.array(
        update.budgetItems.map((yearBudget) => yearBudget.year),
        'int4'
      )})
  `);

  await tx.any(sql.untyped`
    INSERT INTO app.budget (project_id, project_object_id, task_id, year, amount)
    SELECT * FROM ${sql.unnest(
      update.budgetItems.map((row) => [
        projectId ?? null,
        projectObjectId ?? null,
        taskId ?? null,
        row.year,
        row.amount,
      ]),
      ['uuid', 'uuid', 'uuid', 'int4', 'int8']
    )}
  `);
}
