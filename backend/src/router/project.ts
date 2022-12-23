import { TRPCError } from '@trpc/server';
import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  ProjectSearch,
  UpsertProject,
  dbProjectSchema,
  projectIdSchema,
  projectRelationsSchema,
  projectSearchResultSchema,
  projectSearchSchema,
  relationsSchema,
  updateGeometryResultSchema,
  updateGeometrySchema,
  upsertProjectSchema,
} from '@shared/schema/project';

const selectProjectFragment = sql.fragment`
  SELECT
    id,
    project_name AS "projectName",
    description,
    start_date AS "startDate",
    end_date AS "endDate",
    geohash,
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom,
    (lifecycle_state).id AS "lifecycleState"
  FROM app.project
  WHERE deleted = false
`;

async function getProject(id: string) {
  const project = await getPool().maybeOne(sql.type(dbProjectSchema)`
    ${selectProjectFragment}
    AND id = ${id}
  `);

  if (!project) throw new TRPCError({ code: 'NOT_FOUND' });

  return project;
}

async function deleteProject(id: string) {
  const project = await getPool().any(sql.type(projectIdSchema)`
    UPDATE app.project
    SET
      deleted = true
    WHERE id = ${id}
  `);
  if (!project) {
    throw new TRPCError({
      code: 'NOT_FOUND',
    });
  }
  return project;
}

async function upsertProject(project: UpsertProject) {
  const { id, projectName, description, startDate, endDate, lifecycleState } = project;
  if (id) {
    return getPool().one(sql.type(projectIdSchema)`
      UPDATE app.project
      SET
        project_name = ${projectName},
        description = ${description},
        start_date = ${startDate},
        end_date = ${endDate},
        lifecycle_state = ('HankkeenElinkaarentila',${lifecycleState})
      WHERE id = ${id}
      RETURNING id
    `);
  } else {
    return getPool().one(
      sql.type(projectIdSchema)`
        INSERT INTO app.project (project_name, description, start_date, end_date, lifecycle_state)
        VALUES (${projectName}, ${description}, ${startDate}, ${endDate}, ('HankkeenElinkaarentila',${lifecycleState}))
        RETURNING id
      `
    );
  }
}

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

function timePeriodFragment(input: z.infer<typeof projectSearchSchema>) {
  const startDate = input.dateRange?.startDate;
  const endDate = input.dateRange?.endDate;
  if (startDate && endDate) {
    return sql.fragment`
      daterange(start_date, end_date) && daterange(${startDate}, ${endDate})
    `;
  }
  return sql.fragment`true`;
}

function mapExtentFragment(extent: number[] | undefined) {
  if (!extent) return sql.fragment`true`;

  return sql.fragment`
    ST_Intersects(
      geom,
      ST_SetSRID(
        ST_MakeBox2d(
          ST_Point(${extent[0]}, ${extent[1]}),
          ST_Point(${extent[2]}, ${extent[3]})
        ),
        3067
      )
    )
  `;
}

function orderByFragment(input: z.infer<typeof projectSearchSchema>) {
  if (input?.text && input.text.trim().length > 0) {
    return sql.fragment`ORDER BY ts_rank(tsv, to_tsquery('simple', ${input.text})) DESC`;
  }
  return sql.fragment`ORDER BY start_date DESC`;
}

function getFilterFragment(input: z.infer<typeof projectSearchSchema>) {
  return sql.fragment`
      AND ${textSearchFragment(input.text)}
      AND ${mapExtentFragment(input.map?.extent)}
      AND ${timePeriodFragment(input)}
      AND ${
        input.lifecycleStates && input.lifecycleStates?.length > 0
          ? sql.fragment`(lifecycle_state).id = ANY(${sql.array(input.lifecycleStates, 'text')})`
          : sql.fragment`true`
      }
      ${orderByFragment(input)}
  `;
}

async function updateProjectRelations(
  projectId: string,
  targetProjectId: string,
  relation: 'parent' | 'child' | 'related'
) {
  let projectRelation = 'relates_to';
  let subjectProject = projectId;
  let objectProject = targetProjectId;
  if (relation === 'parent') {
    projectRelation = 'is_parent_of';
    subjectProject = targetProjectId;
    objectProject = projectId;
  } else if (relation === 'child') {
    projectRelation = 'is_parent_of';
  }
  return getPool().any(sql.type(relationsSchema)`
    INSERT INTO app.project_relation (project_id, target_project_id, relation_type)
    VALUES (${subjectProject}, ${objectProject}, ${projectRelation});
  `);
}

async function removeProjectRelation(
  projectId: string,
  targetProjectId: string,
  relation: 'parent' | 'child' | 'related'
) {
  let projectRelation = 'relates_to';
  let subjectProject = projectId;
  let objectProject = targetProjectId;
  if (relation === 'parent') {
    projectRelation = 'is_parent_of';
    subjectProject = targetProjectId;
    objectProject = projectId;
  } else if (relation === 'child') {
    projectRelation = 'is_parent_of';
  }
  return getPool().any(sql.type(relationsSchema)`
    DELETE FROM app.project_relation
    WHERE project_id = ${subjectProject} AND target_project_id = ${objectProject} AND relation_type = ${projectRelation}
    OR project_id = ${objectProject} AND target_project_id = ${subjectProject} AND relation_type = ${projectRelation}
  `);
}

async function getRelatedProjects(id: string) {
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

export const createProjectRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(projectSearchSchema).query(async ({ input }) => {
      const { map, limit = 250 } = input;

      const resultSchema = z.object({ result: projectSearchResultSchema });
      const dbResult = await getPool().one(sql.type(resultSchema)`
        WITH projects AS (
          ${selectProjectFragment}
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
    }),

    upsert: t.procedure.input(upsertProjectSchema).mutation(async ({ input }) => {
      const result = await upsertProject(input);
      return getProject(result.id);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),

    getRelations: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getRelatedProjects(id);
    }),

    delete: t.procedure.input(projectIdSchema).mutation(async ({ input }) => {
      const { id } = input;
      return await deleteProject(id);
    }),

    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input }) => {
      const { id, features } = input;
      return getPool().one(sql.type(updateGeometryResultSchema)`
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
    }),

    updateRelations: t.procedure.input(relationsSchema).mutation(async ({ input }) => {
      const { subjectProjectId, objectProjectId, relation } = input;
      return await updateProjectRelations(subjectProjectId, objectProjectId, relation);
    }),

    remoteRelation: t.procedure.input(relationsSchema).mutation(async ({ input }) => {
      const { subjectProjectId: projectId, objectProjectId: targetProjectId, relation } = input;
      return await removeProjectRelation(projectId, targetProjectId, relation);
    }),
  });
