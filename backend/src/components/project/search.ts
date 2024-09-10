import { DatabaseTransactionConnection } from 'slonik';
import { z } from 'zod';

import { getPool, sql } from '@backend/db.js';

import {
  ProjectListParams,
  ProjectSearch,
  projectSearchResultSchema,
} from '@shared/schema/project/index.js';

const CLUSTER_ZOOM_BELOW = 10;

type TextToSearchTermsOpts = {
  minTermLength?: number;
};

export function textToTsSearchTerms(text: string | undefined, options?: TextToSearchTermsOpts) {
  const minTermLength = options?.minTermLength ?? 0;
  if (text?.length && text.length < minTermLength) return null;
  return (
    text
      ?.split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ') || null
  );
}

function timePeriodFragment(input: ProjectSearch) {
  const startDate = input.dateRange?.startDate ?? null;
  const endDate = input.dateRange?.endDate ?? null;
  if (!startDate && !endDate) {
    return sql.fragment`true`;
  }
  return sql.fragment`
    daterange(project.start_date, project.end_date, '[]') && daterange(${startDate}, ${endDate}, '[]')
  `;
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

function ownerFragment(input: ProjectSearch) {
  if (input?.owners && input.owners.length > 0) {
    return sql.fragment`project.owner = ANY(${sql.array(input.owners, 'text')})`;
  }
  return sql.fragment`true`;
}

function onlyCoversMunicipalityFragment(input: ProjectSearch) {
  if (input.onlyCoversMunicipality) {
    return sql.fragment`project.covers_entire_municipality = true`;
  }
  return sql.fragment`true`;
}

export function getFilterFragment(input: ProjectSearch) {
  return sql.fragment`
      ${mapExtentFragment(input)}
      AND ${timePeriodFragment(input)}
      AND ${ownerFragment(input)}
      AND ${onlyCoversMunicipalityFragment(input)}
      AND ${
        input.lifecycleStates && input.lifecycleStates?.length > 0
          ? sql.fragment`(project.lifecycle_state).id = ANY(${sql.array(
              input.lifecycleStates,
              'text',
            )})`
          : sql.fragment`true`
      }
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
  if (!zoom || zoom > CLUSTER_ZOOM_BELOW) return sql.fragment`'[]'::jsonb`;

  return sql.fragment`
    (
      SELECT COALESCE(jsonb_agg(clusters.*), '[]'::jsonb)
      FROM (
        SELECT
          jsonb_agg(id) AS "clusterProjectIds",
          substr(geohash, 1, ${zoomToGeohashLength(zoom)}) AS "clusterGeohash",
          count(*) AS "clusterCount",
          ST_AsGeoJSON(ST_Centroid(ST_Collect(geom))) AS "clusterLocation",
          jsonb_build_object(
            'investmentProject', count(*) FILTER (WHERE ("projectType" = 'investmentProject')),
      	    'maintenanceProject', count(*) FILTER (WHERE ("projectType" = 'maintenanceProject')),
      	    'detailplanProject', count(*) FILTER (WHERE ("projectType" = 'detailplanProject'))
      	  ) AS "projectDistribution"
        FROM projects
        WHERE geom IS NOT NULL
        GROUP BY "clusterGeohash"
    ) clusters)
  `;
}

export function investmentProjectFragment(input: ProjectSearch) {
  const filters = input.filters.investmentProject;
  return sql.fragment`
    SELECT
      project_investment.id,
      'investmentProject' AS "projectType"
    FROM app.project_investment
    LEFT JOIN app.project_committee ON project_committee.project_id = project_investment.id
    WHERE ${
      Object.keys(input.filters).length !== 0 && !filters
        ? sql.fragment`false`
        : sql.fragment`
          ${
            filters?.committees && filters.committees.length > 0
              ? sql.fragment`(project_committee.committee_type).id = ANY(${sql.array(
                  filters.committees,
                  'text',
                )})`
              : sql.fragment`true`
          }
        `
    }
  `;
}

export function maintenanceProjectFragment(input: ProjectSearch) {
  const filters = input.filters.maintenanceProject;
  return sql.fragment`
    SELECT
      project_maintenance.id,
      'maintenanceProject' AS "projectType"
    FROM app.project_maintenance
    LEFT JOIN app.project_committee ON project_committee.project_id = project_maintenance.id
    WHERE ${
      Object.keys(input.filters).length !== 0 && !filters
        ? sql.fragment`false`
        : sql.fragment`
          ${
            filters?.committees && filters.committees.length > 0
              ? sql.fragment`(project_committee.committee_type).id = ANY(${sql.array(
                  filters.committees,
                  'text',
                )})`
              : sql.fragment`true`
          }
        `
    }
  `;
}

export function detailplanProjectFragment(input: ProjectSearch) {
  const filters = input.filters.detailplanProject;
  return sql.fragment`
    SELECT
      project_detailplan.id,
      project_detailplan.detailplan_id AS "detailplanId",
      'detailplanProject' AS "projectType"
    FROM app.project_detailplan
    WHERE ${
      Object.keys(input.filters).length !== 0 && !filters
        ? sql.fragment`false`
        : sql.fragment`
          ${
            filters?.preparers && filters.preparers.length > 0
              ? sql.fragment`project_detailplan.preparer = ANY(${sql.array(
                  filters.preparers,
                  'text',
                )})`
              : sql.fragment`true`
          }
          AND ${
            filters?.planningZones && filters.planningZones.length > 0
              ? sql.fragment`(project_detailplan.planning_zone).id = ANY(${sql.array(
                  filters.planningZones,
                  'text',
                )})`
              : sql.fragment`true`
          }
          AND ${
            filters?.subtypes && filters.subtypes.length > 0
              ? sql.fragment`(project_detailplan.subtype).id = ANY(${sql.array(
                  filters.subtypes,
                  'text',
                )})`
              : sql.fragment`true`
          }
        `
    }
  `;
}

export async function projectSearch(
  input: ProjectSearch,
  tx?: DatabaseTransactionConnection | null,
) {
  const conn = tx ?? getPool();
  const { map, limit = 500 } = input;
  const isClusterSearch = map?.zoom && map.zoom < CLUSTER_ZOOM_BELOW;
  const resultSchema = z.object({ result: projectSearchResultSchema });

  const dbResult = await conn.one(sql.type(resultSchema)`
    WITH ranked_projects AS (
      SELECT
        project.id,
        project.project_name,
        ts_rank(
          COALESCE(project.tsv, '') || COALESCE(project_detailplan.tsv, ''),
          to_tsquery('simple', ${textToTsSearchTerms(input.text)})
        ) AS tsrank
      FROM app.project
      LEFT JOIN app.project_detailplan ON project.id = project_detailplan.id
      WHERE
        deleted = false AND ${getFilterFragment(input) ?? ''}
    ), all_projects AS (
      SELECT
        ranked_projects.id,
        tsrank,
        similarity AS name_similarity
      FROM ranked_projects, similarity(${input?.text ?? ''}, ranked_projects.project_name)
      WHERE tsrank IS NULL
        OR tsrank > 0.01
        OR ranked_projects.project_name LIKE '%' || ${input?.text ?? ''} || '%'
    ), investment_projects AS (
      ${investmentProjectFragment(input)}
    ), maintenance_projects AS (
      ${maintenanceProjectFragment(input)}
    ), detailplan_projects AS (
      ${detailplanProjectFragment(input)}
    ), projects AS (
      SELECT
        filtered_projects.id,
        "projectType",
        app.project.start_date AS "startDate",
        app.project.end_date AS "endDate",
        app.project.project_name AS "projectName",
        app.project.covers_entire_municipality AS "coversMunicipality",
        "tsrank",
        "name_similarity",
        "detailplanId",
        geom,
        geohash
      FROM (
        SELECT id, "projectType", NULL::int AS "detailplanId" from investment_projects
          UNION ALL
        SELECT id, "projectType", NULL::int AS "detailplanId" from maintenance_projects
          UNION ALL
        SELECT id, "projectType", "detailplanId" from detailplan_projects
      ) AS filtered_projects
      INNER JOIN all_projects ON all_projects.id = filtered_projects.id
      INNER JOIN app.project ON app.project.id = filtered_projects.id
    ), limited AS (
      SELECT
        id AS "projectId",
        "startDate",
        "endDate",
        "projectName",
        "projectType",
        "detailplanId",
        ${isClusterSearch ? sql.fragment`NULL` : sql.fragment`st_asgeojson(geom)`} AS geom,
        "coversMunicipality"
      FROM projects
      ORDER BY GREATEST(name_similarity, tsrank)  DESC, "startDate" DESC
      LIMIT ${limit}
    )
   SELECT jsonb_build_object(
      'projects', COALESCE((SELECT jsonb_agg(limited.*) FROM limited), '[]'::jsonb),
      'clusters', ${clusterResultsFragment(map?.zoom)}
    ) AS result
    `);

  return dbResult.result;
}

export async function listProjects(input: ProjectListParams) {
  const resultSchema = z.object({ projectName: z.string(), projectId: z.string() });
  return await getPool().many(sql.type(resultSchema)`
    SELECT project_name AS "projectName", app.project.id AS "projectId"
    FROM app.project
    ${
      input.projectType === 'investmentProject'
        ? sql.fragment`INNER JOIN app.project_investment ON project_investment.id = app.project.id`
        : sql.fragment``
    }
     ${
       input.projectType === 'maintenanceProject'
         ? sql.fragment`INNER JOIN app.project_maintenance ON project_maintenance.id = app.project.id`
         : sql.fragment``
     }
    ${
      input.projectType === 'detailplanProject'
        ? sql.fragment`INNER JOIN app.project_detailplan ON project_detailplan.id = app.project.id`
        : sql.fragment``
    }
    WHERE deleted = false
    ORDER BY project_name ASC
  `);
}
