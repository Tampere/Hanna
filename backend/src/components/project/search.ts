import { z } from 'zod';

import { getPool, sql } from '@backend/db';

import { ProjectSearch, projectSearchResultSchema } from '@shared/schema/project';

const tsvectorFragment = sql.fragment`
  COALESCE(project_detailplan.tsv, '') ||
  COALESCE(project.tsv, '')
`;

function tsqueryFragment(text: string) {
  const textQuery = text
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .map((term) => `${term}:*`)
    .join(' & ');
  return sql.fragment`to_tsquery('simple', ${textQuery})`;
}

function textSearchFragment(text: ProjectSearch['text']) {
  if (text && text.trim().length > 0) {
    return sql.fragment`
      ${tsvectorFragment} @@ ${tsqueryFragment(text)}
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
    return sql.fragment`ORDER BY ts_rank(${tsvectorFragment}, ${tsqueryFragment(input.text)}) DESC`;
  }
  return sql.fragment`ORDER BY project.start_date DESC`;
}

function ownerFragment(input: ProjectSearch) {
  if (input?.owners && input.owners.length > 0) {
    return sql.fragment`project.owner = ANY(${sql.array(input.owners, 'text')})`;
  }
  return sql.fragment`true`;
}

export function getFilterFragment(input: ProjectSearch) {
  return sql.fragment`
      AND ${textSearchFragment(input.text)}
      AND ${mapExtentFragment(input)}
      AND ${timePeriodFragment(input)}
      AND ${ownerFragment(input)}
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

function filterInvestmentProjectFragment(input: ProjectSearch['filters']['investmentProject']) {
  return sql.fragment`
    ${
      input?.committees && input.committees.length > 0
        ? sql.fragment`(project_committee.committee_type).id = ANY(${sql.array(
            input.committees,
            'text'
          )})`
        : sql.fragment`true`
    }
  `;
}

function filterDetailplanProjectFragment(input: ProjectSearch['filters']['detailplanProject']) {
  return sql.fragment`
    ${
      input?.preparers && input.preparers.length > 0
        ? sql.fragment`project_detailplan.preparer = ANY(${sql.array(input.preparers, 'text')})`
        : sql.fragment`true`
    }
    AND ${
      input?.planningZones && input.planningZones.length > 0
        ? sql.fragment`(project_detailplan.planning_zone).id = ANY(${sql.array(
            input.planningZones,
            'text'
          )})`
        : sql.fragment`true`
    }
    AND ${
      input?.subtypes && input.subtypes.length > 0
        ? sql.fragment`(project_detailplan.subtype).id = ANY(${sql.array(input.subtypes, 'text')})`
        : sql.fragment`true`
    }
  `;
}

export async function projectSearch(input: ProjectSearch) {
  const { map, limit = 250 } = input;

  const filteredTypes = new Set(Object.keys(input.filters));
  const resultSchema = z.object({ result: projectSearchResultSchema });
  const dbResult = await getPool().one(sql.type(resultSchema)`
    WITH all_projects AS (
      SELECT
        project.id,
        project.project_name AS "projectName",
        project.description,
        project.owner,
        project.start_date AS "startDate",
        project.end_date AS "endDate",
        project.geohash,
        ST_AsGeoJSON(ST_CollectionExtract(project.geom)) AS geom,
        (project.lifecycle_state).id AS "lifecycleState",
        -- Select tsvectors from all tables for universal text filtering
        project.tsv,
        project_detailplan.tsv
      FROM app.project
      LEFT JOIN app.project_detailplan ON project.id = project_detailplan.id
      WHERE deleted = false
      ${getFilterFragment(input) ?? ''}
    ), investment_projects AS (
      SELECT
        project_investment.id,
        'investmentProject' AS "projectType"
      FROM app.project_investment
      LEFT JOIN app.project_committee ON project_committee.project_id = project_investment.id
      WHERE ${
        filteredTypes.size !== 0 && !filteredTypes.has('investmentProject')
          ? sql.fragment`false`
          : filterInvestmentProjectFragment(input.filters?.investmentProject)
      }
     ), detailplan_projects AS (
      SELECT
        project_detailplan.id,
        'detailplanProject' AS "projectType"
      FROM app.project_detailplan
      WHERE ${
        filteredTypes.size !== 0 && !filteredTypes.has('detailplanProject')
          ? sql.fragment`false`
          : filterDetailplanProjectFragment(input.filters?.detailplanProject)
      }
    ), projects AS (
      SELECT *
      FROM (
        SELECT id, "projectType" from investment_projects
          UNION ALL
        SELECT id, "projectType" from detailplan_projects
      ) AS filtered_projects
      INNER JOIN all_projects ON all_projects.id = filtered_projects.id
    ), limited AS (
      SELECT *
      FROM projects
      LIMIT ${limit}
    )
   SELECT jsonb_build_object(
      'projects', (SELECT jsonb_agg(limited.*) FROM limited),
      'clusters', ${clusterResultsFragment(map?.zoom)}
    ) AS result
    `);
  return dbResult.result;
}
