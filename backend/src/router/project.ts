import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  UpsertProject,
  dbProjectSchema,
  projectGetSchema,
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
    end_date AS "endDate"
  FROM app.project
`;

async function getProject(id: string) {
  return getPool().one(sql.type(dbProjectSchema)`
    ${selectProjectFragment}
    WHERE id = ${id}
  `);
}

async function upsertProject(project: UpsertProject) {
  const { id, projectName, description, startDate, endDate } = project;
  if (id) {
    return getPool().one(sql.type(projectGetSchema)`
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
      sql.type(projectGetSchema)`
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
      return getPool().many(sql.type(dbProjectSchema)`
        ${selectProjectFragment}
        ORDER BY start_date DESC
      `);
    }),

    upsert: t.procedure.input(upsertProjectSchema).mutation(async ({ input }) => {
      const result = await upsertProject(input);
      return getProject(result.id);
    }),

    get: t.procedure.input(projectGetSchema).query(async ({ input }) => {
      const { id } = input;
      return getProject(id);
    }),

    updateGeometry: t.procedure.input(updateGeometrySchema).mutation(async ({ input }) => {
      const { id, geometry } = input;
      return getPool().one(sql.type(updateGeometryResultSchema)`
        UPDATE app.project
        SET geom = ST_GeomFromGeoJSON(${geometry})
        WHERE id = ${id}
        RETURNING id, ST_AsGeoJSON(geom) AS geometry
      `);
    }),
  });
