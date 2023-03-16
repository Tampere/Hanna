import { z } from 'zod';

import { addAuditEvent } from '@backend/components/audit';
import { getPool, sql } from '@backend/db';

import {
  CostEstimatesInput,
  CostEstimatesUpdate,
  ProjectSearch,
  Relation,
  UpdateGeometry,
  costEstimateSchema,
  projectRelationsSchema,
  projectSearchResultSchema,
  relationsSchema,
  updateGeometryResultSchema,
} from '@shared/schema/project';
import { User } from '@shared/schema/user';

function textSearchFragment(text: ProjectSearch['text']) {
  if (text && text.trim().length > 0) {
    const textQuery = text
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ');
    return sql.fragment`
      tsv @@ to_tsquery('simple', ${textQuery})
    `;
  }
  return sql.fragment`true`;
}

function timePeriodFragment(input: ProjectSearch) {
  const startDate = input.dateRange?.startDate;
  const endDate = input.dateRange?.endDate;
  if (startDate && endDate) {
    return sql.fragment`
      daterange(project.start_date, project.end_date, '[]') && daterange(${startDate}, ${endDate}, '[]')
    `;
  }
  return sql.fragment`true`;
}

function mapExtentFragment(input: ProjectSearch) {
  const extent = input.map?.extent;
  if (!extent) return sql.fragment`true`;
  const includeWithoutGeom = input.includeWithoutGeom ? sql.fragment`true` : sql.fragment`false`;

  return sql.fragment`
    (ST_Intersects(
      project.geom,
      ST_SetSRID(
        ST_MakeBox2d(
          ST_Point(${extent[0]}, ${extent[1]}),
          ST_Point(${extent[2]}, ${extent[3]})
        ),
        3067
      )
    ) OR (${includeWithoutGeom} AND project.geom IS NULL))
  `;
}

function orderByFragment(input: ProjectSearch) {
  if (input?.text && input.text.trim().length > 0) {
    return sql.fragment`ORDER BY ts_rank(tsv, to_tsquery('simple', ${input.text})) DESC`;
  }
  return sql.fragment`ORDER BY project.start_date DESC`;
}

export function getFilterFragment(input: ProjectSearch) {
  return sql.fragment`
      AND ${textSearchFragment(input.text)}
      AND ${mapExtentFragment(input)}
      AND ${timePeriodFragment(input)}
      AND ${
        input.lifecycleStates && input.lifecycleStates?.length > 0
          ? sql.fragment`(project.lifecycle_state).id = ANY(${sql.array(
              input.lifecycleStates,
              'text'
            )})
          `
          : sql.fragment`true`
      }
      ${orderByFragment(input)}
  `;
}

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
  if (!zoom || zoom > 10) return sql.fragment`'[]'::jsonb`;

  return sql.fragment`
    (
      SELECT jsonb_agg(clusters.*)
      FROM (
        SELECT
          substr(geohash, 1, ${zoomToGeohashLength(zoom)}) AS "clusterGeohash",
          count(*) AS "clusterCount",
          ST_AsGeoJSON(ST_Centroid(ST_Collect(geom))) AS "clusterLocation"
        FROM projects
        GROUP BY "clusterGeohash"
    ) clusters)
  `;
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

const searchProjectFragment = sql.fragment`
  SELECT
    project.id,
    project_name AS "projectName",
    description,
    owner,
    start_date AS "startDate",
    end_date AS "endDate",
    geohash,
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    (lifecycle_state).id AS "lifecycleState"
  FROM app.project
  WHERE deleted = false
`;

export async function projectSearch(input: ProjectSearch) {
  const { map, limit = 250 } = input;

  const resultSchema = z.object({ result: projectSearchResultSchema });
  const dbResult = await getPool().one(sql.type(resultSchema)`
    WITH projects AS (
      ${searchProjectFragment}
      ${getFilterFragment(input) ?? ''}
    ), limited AS (
      SELECT * FROM projects LIMIT ${limit}
    )
    SELECT jsonb_build_object(
      'projects', (SELECT jsonb_agg(limited.*) FROM limited),
      'clusters', ${clusterResultsFragment(map?.zoom)}
    ) AS result
    `);
  return dbResult.result;
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
