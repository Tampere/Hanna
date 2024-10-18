import { DatabaseTransactionConnection, sql } from 'slonik';
import { z } from 'zod';

import { textToTsSearchTerms } from '@backend/components/project/search.js';
import {
  getProjectObjectGeometryDumpFragment,
  timePeriodFragment,
} from '@backend/components/projectObject/index.js';
import { getPool } from '@backend/db.js';

import {
  ObjectsByProjectSearch,
  ProjectObjectSearch,
  projectObjectSearchResultSchema,
} from '@shared/schema/projectObject/search.js';

import { getProjectGeometryDumpFragment } from '../project/base.js';

const CLUSTER_ZOOM_BELOW = 10;

function getProjectObjectSearchFragment({
  projectIds,
  withRank,
  includeDeleted,
  withGeoHash,
  withGeometries,
}: {
  projectIds?: string[];
  withRank?: boolean;
  includeDeleted?: boolean;
  withGeoHash?: boolean;
  withGeometries?: boolean;
} = {}) {
  const filterFragment = sql.fragment`${
    includeDeleted ? sql.fragment`` : sql.fragment`WHERE po.deleted = false`
  }
  ${
    projectIds
      ? includeDeleted
        ? sql.fragment`WHERE po.project_id = ANY(${sql.array(projectIds, 'uuid')})`
        : sql.fragment`AND po.project_id = ANY(${sql.array(projectIds, 'uuid')})`
      : sql.fragment``
  }`;

  return sql.fragment`
  ${
    withGeometries
      ? sql.fragment`
    WITH object_dump AS (${getProjectObjectGeometryDumpFragment()}),
    project_dump AS (${getProjectGeometryDumpFragment()})
   `
      : sql.fragment``
  }
    SELECT
      po.id AS "projectObjectId",
      po.start_date AS "startDate",
      po.end_date AS "endDate",
      po.object_name AS "objectName",
      (object_stage).id AS "objectStage",
      jsonb_build_object(
        'projectId', project.id,
        'projectName', project.project_name,
        'coversMunicipality', project.covers_entire_municipality,
        'startDate', project.start_date,
        'endDate', project.end_date,
        'projectType', (CASE WHEN (poi.project_object_id IS NULL) THEN 'maintenanceProject' ELSE 'investmentProject' END),
        'geom', ${withGeometries ? sql.fragment`project_dump.geom` : sql.fragment`null`}
      ) as project,
      po.geom as "rawGeom"
      ${withGeometries ? sql.fragment`, object_dump.geom` : sql.fragment``}
      ${withGeoHash ? sql.fragment`, po.geohash` : sql.fragment``}
      ${
        withRank
          ? sql.fragment`, dense_rank() OVER (ORDER BY project.project_name)::int4 AS "projectIndex"`
          : sql.fragment``
      }
    FROM app.project_object po
    LEFT JOIN app.project_object_investment poi ON po.id = poi.project_object_id
    LEFT JOIN app.project_object_maintenance pom ON po.id = pom.project_object_id
    INNER JOIN app.project ON po.project_id = project.id
    ${
      withGeometries
        ? sql.fragment`
        LEFT JOIN object_dump ON po.id = object_dump.id
        LEFT JOIN project_dump ON project.id = project_dump.id`
        : sql.fragment``
    }
    ${filterFragment}
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
    return sql.fragment`HAVING ${objectParticipantUser} = ANY(array_agg(pour.user_id))`;
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
          row_number() OVER () AS "clusterIndex",
          jsonb_agg("projectObjectId") AS "clusterProjectObjectIds",
          substr(geohash, 1, ${zoomToGeohashLength(zoom)}) AS "clusterGeohash",
          count(*) AS "clusterCount",
          ST_AsGeoJSON(ST_Centroid(ST_Collect(ST_AsGeoJSON(ST_CollectionExtract("rawGeom"))))) AS "clusterLocation"
        FROM search_results
        GROUP BY "clusterGeohash"
    ) clusters)
  `;
}

export async function projectObjectSearch(input: ProjectObjectSearch) {
  const { map, limit = 500 } = input;
  const resultSchema = z.object({ result: projectObjectSearchResultSchema });

  const objectNameSearch = textToTsSearchTerms(input.projectObjectName, { minTermLength: 1 });
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
    WITH total_results AS (
    ${getProjectObjectSearchFragment({
      withRank: true,
      includeDeleted: true,
      withGeoHash: true,
      withGeometries,
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
        (pour.role = ('InvestointiKohdeKayttajaRooli', '01')::app.code_id AND pour.user_id = ANY(${sql.array(
          rakennuttajaUsers,
          'text',
        )}))

      )
      AND (
        ${sql.array(suunnitteluttajaUsers, 'text')} = '{}'::TEXT[] OR
        (pour.role = ('InvestointiKohdeKayttajaRooli', '02')::app.code_id AND pour.user_id = ANY(${sql.array(
          suunnitteluttajaUsers,
          'text',
        )}))
      )
    ${objectParticipantFragment(objectParticipantUser)}

  ),
   search_results AS (select * from total_results LIMIT ${limit}),
   project_object_results AS (
    SELECT
      search_results."projectObjectId",
      "startDate",
      "endDate",
      "objectName",
      "objectStage",
      project
      ${withGeometries ? sql.fragment`, search_results.geom` : sql.fragment``}
    FROM search_results
    ORDER BY "projectIndex"
  ) SELECT jsonb_build_object(
      'totalCount', (SELECT count(*) FROM total_results),
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
  const isClusterSearch = Boolean(map?.zoom && map.zoom < CLUSTER_ZOOM_BELOW);
  if (isClusterSearch) return null;
  return conn.any(sql.type(projectObjectSearchResultSchema.pick({ projectObjects: true }))`
    ${getProjectObjectSearchFragment({ projectIds, withGeometries: !isClusterSearch })}
  `);
}
