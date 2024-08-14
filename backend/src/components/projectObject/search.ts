import { DatabaseTransactionConnection, sql } from 'slonik';
import { z } from 'zod';

import { textToSearchTerms } from '@backend/components/project/search.js';
import { timePeriodFragment } from '@backend/components/projectObject/index.js';
import { getPool } from '@backend/db.js';

import {
  ObjectsByProjectSearch,
  ProjectObjectSearch,
  projectObjectSearchResultSchema,
} from '@shared/schema/projectObject/search.js';

const CLUSTER_ZOOM_BELOW = 10;

function getProjectObjectSearchFragment({
  projectIds,
  withRank,
  includeDeleted,
  withGeoHash,
  withProjectGeometry,
}: {
  projectIds?: string[];
  withRank?: boolean;
  includeDeleted?: boolean;
  withGeoHash?: boolean;
  withProjectGeometry?: boolean;
} = {}) {
  return sql.fragment`
    SELECT
      po.id AS "projectObjectId",
      po.start_date AS "startDate",
      po.end_date AS "endDate",
      po.object_name AS "objectName",
      (object_stage).id AS "objectStage",
      ST_AsGeoJSON(ST_CollectionExtract(po.geom)) AS geom,
      jsonb_build_object(
        'projectId', po.project_id,
        'startDate', project.start_date,
        'endDate', project.end_date,
        'projectName', project.project_name,
        'projectType', CASE WHEN (poi.project_object_id IS NULL) THEN 'maintenanceProject' ELSE 'investmentProject' END
        ${
          withProjectGeometry
            ? sql.fragment`,'geom', ST_AsGeoJSON(ST_CollectionExtract(project.geom))`
            : sql.fragment``
        }
      ) as project
      ${withGeoHash ? sql.fragment`, po.geohash` : sql.fragment``}
      ${
        withProjectGeometry
          ? sql.fragment`, ST_AsGeoJSON(ST_CollectionExtract(project.geom)) AS "projectGeom"`
          : sql.fragment``
      }

      ${
        withRank
          ? sql.fragment`, dense_rank() OVER (ORDER BY project.project_name)::int4 AS "projectIndex"`
          : sql.fragment``
      }
    FROM app.project_object po
    LEFT JOIN app.project_object_investment poi ON po.id = poi.project_object_id
    LEFT JOIN app.project_object_maintenance pom ON po.id = pom.project_object_id
    INNER JOIN app.project ON po.project_id = project.id
    ${includeDeleted ? sql.fragment`` : sql.fragment`WHERE po.deleted = false`}
    ${
      projectIds
        ? includeDeleted
          ? sql.fragment`WHERE po.project_id = ANY(${sql.array(projectIds, 'uuid')})`
          : sql.fragment`AND po.project_id = ANY(${sql.array(projectIds, 'uuid')})`
        : sql.fragment``
    }
    `;
}

export function mapExtentFragment(input: ProjectObjectSearch) {
  const extent = input.map?.extent;
  if (!extent) return sql.fragment`true`;
  const includeWithoutGeom = input.includeWithoutGeom ? sql.fragment`true` : sql.fragment`false`;

  return sql.fragment`
    (ST_Intersects(
      po.geom,
      ST_SetSRID(
        ST_MakeBox2d(
          ST_Point(${extent[0]}, ${extent[1]}),
          ST_Point(${extent[2]}, ${extent[3]})
        ),
        3067
      )
    ) OR (${includeWithoutGeom} AND po.geom IS NULL))
  `;
}

export function objectParticipantFragment(objectParticipantUser: string | null) {
  if (objectParticipantUser) {
    return sql.fragment`HAVING rakennuttaja_user = ${objectParticipantUser} OR suunnitteluttaja_user = ${objectParticipantUser} OR ${objectParticipantUser} = ANY(array_agg(pour.user_id))`;
  }
  return sql.fragment``;
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

export function clusterResultsFragment(zoom: number | undefined) {
  if (!zoom || zoom > CLUSTER_ZOOM_BELOW) return sql.fragment`'[]'::jsonb`;

  return sql.fragment`
    (
      SELECT jsonb_agg(clusters.*)
      FROM (
        SELECT
          jsonb_agg("projectObjectId") AS "clusterProjectObjectIds",
          substr(geohash, 1, ${zoomToGeohashLength(zoom)}) AS "clusterGeohash",
          count(*) AS "clusterCount",
          ST_AsGeoJSON(ST_Centroid(ST_Collect(geom))) AS "clusterLocation"
        FROM search_results
        GROUP BY "clusterGeohash"
    ) clusters)
  `;
}

export async function projectObjectSearch(input: ProjectObjectSearch) {
  const { map, limit = 500 } = input;
  const resultSchema = z.object({ result: projectObjectSearchResultSchema });

  const objectNameSearch = textToSearchTerms(input.projectObjectName, { minTermLength: 1 });
  const objectNameSubstringSearch =
    input.projectObjectName && input.projectObjectName?.length >= 1 ? input.projectObjectName : '';

  const {
    objectTypes = [],
    objectCategories = [],
    objectUsages = [],
    lifecycleStates = [],
    objectStages = [],
    objectParticipantUser = null,
    rakennuttajaUsers = [],
    suunnitteluttajaUsers = [],
  } = input;

  const withGeometries = Boolean(map?.zoom && map.zoom > CLUSTER_ZOOM_BELOW);

  const dbResult = await getPool().one(sql.type(resultSchema)`
    WITH search_results AS (
    ${getProjectObjectSearchFragment({
      withProjectGeometry: withGeometries,
      withRank: true,
      includeDeleted: true,
      withGeoHash: true,
    })}
    LEFT JOIN app.project_object_user_role pour ON po.id = pour.project_object_id
      WHERE po.deleted = false
      -- search date range intersection
      AND ${timePeriodFragment(input)}
      AND ${mapExtentFragment(input)}
      AND (${objectNameSearch}::text IS NULL OR to_tsquery('simple', ${objectNameSearch}) @@ to_tsvector('simple', po.object_name) OR po.object_name LIKE '%' || ${objectNameSubstringSearch} || '%')
      -- empty array means match all, otherwise check for intersection
      AND (
        ${sql.array(objectTypes, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_type).id) FROM app.project_object_type WHERE po.id = project_object_type.project_object_id) &&
        ${sql.array(objectTypes, 'text')}
      )
      AND (
        ${sql.array(objectCategories, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_category).id) FROM app.project_object_category WHERE po.id = project_object_category.project_object_id) &&
        ${sql.array(objectCategories ?? [], 'text')}
      )
      AND (
        ${sql.array(objectUsages, 'text')} = '{}'::TEXT[] OR
        (SELECT array_agg((object_usage).id) FROM app.project_object_usage WHERE po.id = project_object_usage.project_object_id) &&
        ${sql.array(objectUsages, 'text')}
      )
      AND (
        ${sql.array(lifecycleStates, 'text')} = '{}'::TEXT[] OR
        (po.lifecycle_state).id = ANY(${sql.array(lifecycleStates, 'text')})
      )
      AND (
        ${sql.array(objectStages, 'text')} = '{}'::TEXT[] OR
        (poi.object_stage).id = ANY(${sql.array(objectStages, 'text')})
      )
      AND (
        ${sql.array(rakennuttajaUsers, 'text')} = '{}'::TEXT[] OR
        poi.rakennuttaja_user = ANY(${sql.array(rakennuttajaUsers, 'text')})
      )
      AND (
        ${sql.array(suunnitteluttajaUsers, 'text')} = '{}'::TEXT[] OR
        poi.suunnitteluttaja_user = ANY(${sql.array(suunnitteluttajaUsers, 'text')})
      )
    GROUP BY po.id, project.project_name, project.geom, project.start_date, project.end_date, poi.project_object_id
    ${objectParticipantFragment(objectParticipantUser)}
    LIMIT ${limit}
  ), project_object_results AS (
    SELECT
      "projectObjectId",
      "startDate",
      "endDate",
      "objectName",
      "objectStage",
      project
      ${
        withGeometries
          ? sql.fragment`, geom,
      "projectGeom"`
          : sql.fragment``
      }

    FROM search_results
    ORDER BY "projectIndex"
  ) SELECT jsonb_build_object(
      'projectObjects', (SELECT jsonb_agg(project_object_results.*) FROM project_object_results),
      'clusters', ${clusterResultsFragment(map?.zoom)}
    ) AS result
    `);

  return dbResult.result;
}

export async function getProjectObjectsByProjectSearch(
  input: ObjectsByProjectSearch,
  tx?: DatabaseTransactionConnection | null,
) {
  const { map, projectIds } = input;
  const conn = tx ?? getPool();
  const isClusterSearch = map?.zoom && map.zoom < CLUSTER_ZOOM_BELOW;
  if (isClusterSearch) return null;
  return conn.any(sql.type(projectObjectSearchResultSchema.pick({ projectObjects: true }))`
    ${getProjectObjectSearchFragment({ projectIds })}
  `);
}
