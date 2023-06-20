import { z } from 'zod';

import { getSapActuals, getSapProject, sapProjectExists } from '@backend/components/sap/dataImport';
import { getPool, sql } from '@backend/db';

import { yearlyActualsSchema } from '@shared/schema/sapActuals';

import { TRPC } from '.';

function yearRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}

export const createSapRouter = (t: TRPC) =>
  t.router({
    getSapProject: t.procedure
      .input(z.object({ projectId: z.string() }))
      .mutation(async ({ input }) => {
        return getSapProject(input.projectId);
      }),

    getSapActuals: t.procedure
      .input(z.object({ projectId: z.string(), year: z.number() }))
      .mutation(async ({ input }) => {
        return getSapActuals(input.projectId, input.year);
      }),

    getWBSByProjectId: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        const result = await getPool().maybeOne(sql.type(z.object({ sapProjectId: z.string() }))`
          SELECT sap_project_id AS "sapProjectId"
          FROM app.project
          WHERE id = ${input.projectId}
        `);
        if (result?.sapProjectId) {
          const sapProject = await getSapProject(result?.sapProjectId);
          return sapProject?.wbs
            .filter((wbs) => wbs.hierarchyLevel > 1)
            .map((wbs) => {
              return {
                wbsId: wbs.wbsId,
                shortDescription: wbs.shortDescription,
              };
            });
        } else {
          return null;
        }
      }),

    getYearlyActualsByProjectId: t.procedure
      .input(
        z.object({ projectId: z.string(), startYear: z.number().int(), endYear: z.number().int() })
      )
      .query(async ({ input }) => {
        const currentYear = new Date().getFullYear();
        const endYear = Math.min(input.endYear, currentYear);

        const result = await getPool().maybeOne(sql.type(z.object({ sapProjectId: z.string() }))`
          SELECT sap_project_id AS "sapProjectId"
          FROM app.project
          WHERE id = ${input.projectId}
        `);

        if (result?.sapProjectId) {
          await Promise.all(
            yearRange(input.startYear, endYear).map((year) =>
              getSapActuals(result.sapProjectId, year)
            )
          );
        }

        const returnSchema = z.object({ result: yearlyActualsSchema });
        const dbResult = await getPool().maybeOne(sql.type(returnSchema)`
          WITH yearly_totals AS (
            SELECT fiscal_year, sum(value_in_currency_subunit) AS total
            FROM app.sap_actuals_item
            WHERE sap_project_id IN (
                SELECT sap_project_id
                FROM app.project
                WHERE id = ${input.projectId}
            ) AND fiscal_year >= ${input.startYear}
              AND fiscal_year <= ${endYear}
            GROUP BY fiscal_year
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'year', yearly_totals.fiscal_year,
                  'total', yearly_totals.total
              )
          ) AS result
          FROM yearly_totals;
        `);

        return dbResult?.result;
      }),

    getYearlyActualsByProjectObjectId: t.procedure
      .input(
        z.object({
          projectObjectId: z.string(),
          startYear: z.number().int(),
          endYear: z.number().int(),
        })
      )
      .query(async ({ input }) => {
        const currentYear = new Date().getFullYear();
        const endYear = Math.min(input.endYear, currentYear);

        const resultSchema = z.object({ sapWBSId: z.string(), sapProjectId: z.string() });
        const result = await getPool().maybeOne(sql.type(resultSchema)`
          SELECT
            sap_project_id AS "sapProjectId",
            sap_wbs_id AS "sapWBSId"
          FROM app.project_object
          INNER JOIN app.project ON project_object.project_id = project.id
          WHERE project_object.id = ${input.projectObjectId}
        `);

        if (!result?.sapWBSId) {
          return null;
        }

        await Promise.all(
          yearRange(input.startYear, endYear).map((year) =>
            getSapActuals(result.sapProjectId, year)
          )
        );

        const returnSchema = z.object({ result: yearlyActualsSchema });
        const dbResult = await getPool().maybeOne(sql.type(returnSchema)`
          WITH yearly_totals AS (
            SELECT fiscal_year, sum(value_in_currency_subunit) AS total
            FROM app.sap_actuals_item
            WHERE wbs_element_id = ${result.sapWBSId}
              AND fiscal_year >= ${input.startYear}
              AND fiscal_year <= ${endYear}
            GROUP BY fiscal_year
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'year', yearly_totals.fiscal_year,
                  'total', yearly_totals.total
              )
          ) AS result
          FROM yearly_totals;
        `);

        return dbResult?.result;
      }),

    doesSapProjectIdExist: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        return await sapProjectExists(input.projectId);
      }),
  });
