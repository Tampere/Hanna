import { sql } from 'slonik';
import { z } from 'zod';

import { getPool } from '@backend/db';
import { TRPC } from '@backend/router';

import {
  UpsertProject,
  dbProjectSchema,
  projectGetSchema,
  projectSearchSchema,
  searchResultSchema,
  updateGeometrySchema,
  upsertProjectSchema,
} from '@shared/schema/project';

const sqlSelectProject = sql`
  SELECT
    id,
    project_name AS "projectName",
    description,
    start_date AS "startDate",
    end_date AS "endDate"
  FROM app.project
`;

async function getProject(id: string) {
  const project = await getPool().one(sql`
    ${sqlSelectProject}
    WHERE id = ${id}
  `);
  return dbProjectSchema.parse(project);
}

async function upsertProject(project: UpsertProject) {
  const { id, projectName, description, startDate, endDate } = project;
  if (id) {
    const result = await getPool().one(sql`
      UPDATE app.project
      SET
        project_name = ${projectName},
        description = ${description},
        start_date = ${startDate},
        end_date = ${endDate}
      WHERE id = ${id}
      RETURNING id
    `);
    return z.object({ id: z.string() }).parse(result);
  } else {
    const result = await getPool().one(
      sql`
        INSERT INTO app.project (project_name, description, start_date, end_date)
        VALUES (${projectName}, ${description}, ${startDate}, ${endDate})
        RETURNING id
      `
    );
    return z.object({ id: z.string() }).parse(result);
  }
}

export const createProjectRouter = (t: TRPC) =>
  t.router({
    search: t.procedure.input(projectSearchSchema).query(async () => {
      const results = await getPool().query(sql`
        ${sqlSelectProject}
        ORDER BY start_date DESC
      `);
      return searchResultSchema.parse(results.rows);
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
      return getPool().one(sql`
        UPDATE app.project
        SET geom = ST_GeomFromGeoJSON(${geometry})
        WHERE id = ${id}
        RETURNING id, ST_AsGeoJSON(geom) AS geom
      `);
    }),
  });
