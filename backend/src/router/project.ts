import { TRPCError } from '@trpc/server';
import { sql } from 'slonik';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  UpsertProject,
  dbProjectSchema,
  projectIdSchema,
  projectSearchSchema,
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
    ST_AsGeoJSON(ST_CollectionExtract(geom)) AS geom
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
  return getPool().any(sql.type(projectIdSchema)`
    UPDATE app.project
    SET
      deleted = true
    WHERE id = ${id}
  `);
}

async function upsertProject(project: UpsertProject) {
  const { id, projectName, description, startDate, endDate } = project;
  if (id) {
    return getPool().one(sql.type(projectIdSchema)`
      UPDATE app.project
      SET
        project_name = ${projectName},
        description = ${description},
        start_date = ${startDate},
        end_date = ${endDate}
      WHERE id = ${id}
      RETURNING id
    `);
  } else {
    return getPool().one(
      sql.type(projectIdSchema)`
        INSERT INTO app.project (project_name, description, start_date, end_date)
        VALUES (${projectName}, ${description}, ${startDate}, ${endDate})
        RETURNING id
      `
    );
  }
}

export const createProjectRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(projectSearchSchema).query(async () => {
      return getPool().any(sql.type(dbProjectSchema)`
        ${selectProjectFragment}
        ORDER BY start_date DESC
      `);
    }),

    upsert: t.procedure.input(upsertProjectSchema).mutation(async ({ input }) => {
      const result = await upsertProject(input);
      return getProject(result.id);
    }),

    get: t.procedure.input(projectIdSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
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
        RETURNING id, ST_AsGeoJSON(geom) AS geometry
      `);
    }),
  });
