import { z } from 'zod';

import {
  refreshProjectObjectSapActuals,
  refreshProjectSapActuals,
} from '@backend/components/sap/actuals.js';
import {
  getSapActuals,
  getSapProject,
  sapProjectExists,
} from '@backend/components/sap/dataImport.js';
import { yearRange } from '@backend/components/sap/utils.js';
import { getPool, sql } from '@backend/db.js';
import { logger } from '@backend/logging.js';

import { yearlyActualsSchema } from '@shared/schema/sapActuals.js';

import { TRPC } from './index.js';

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
          try {
            const sapProject = await getSapProject(result?.sapProjectId);
            return (
              sapProject?.wbs
                .filter((wbs) => wbs.hierarchyLevel > 1)
                .map((wbs) => {
                  return {
                    wbsId: wbs.wbsId,
                    shortDescription: wbs.shortDescription,
                  };
                }) ?? []
            );
          } catch {
            logger.info(`Error getting sap project for wbs selection`);
            return [];
          }
        } else {
          return null;
        }
      }),

    getYearlyActualsByProjectId: t.procedure
      .input(
        z.object({ projectId: z.string(), startYear: z.number().int(), endYear: z.number().int() }),
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
              getSapActuals(result.sapProjectId, year),
            ),
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
        }),
      )
      .query(async ({ input }) => {
        const result = await refreshProjectObjectSapActuals(
          { start: input.startYear, end: input.endYear },
          input.projectObjectId,
        );

        if (!result) {
          return null;
        }

        const returnSchema = z.object({ result: yearlyActualsSchema });
        const dbResult = await getPool().maybeOne(sql.type(returnSchema)`
          WITH yearly_totals AS (
            SELECT fiscal_year, sum(value_in_currency_subunit) AS total
            FROM app.sap_actuals_item
            WHERE wbs_element_id = ${result.wbsId}
              AND fiscal_year >= ${input.startYear}
              AND fiscal_year <= ${result.endYear}
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

    getMonthlyActualsByProjectId: t.procedure
      .input(
        z.object({
          projectId: z.string(),
          startYear: z.number().int(),
          endYear: z.number().int(),
        }),
      )
      .query(async ({ input }) => {
        const result = await refreshProjectSapActuals(
          { start: input.startYear, end: input.endYear },
          input.projectId,
        );

        if (!result) {
          return null;
        }

        const returnSchema = z.object({
          result: z.array(z.object({ year: z.number(), month: z.number(), total: z.number() })),
        });
        const dbResult = await getPool().maybeOne(sql.type(returnSchema)`
        WITH monthly_totals AS (
          SELECT
            fiscal_year,
            EXTRACT(MONTH FROM posting_date) AS fiscal_month,
            sum(value_in_currency_subunit) AS total
          FROM app.sap_actuals_item
          WHERE sap_project_id = ${result.sapProjectId}
            AND fiscal_year >= ${input.startYear}
            AND fiscal_year <= ${result.endYear}
            AND (document_type IS NULL OR document_type <> 'AA')
          GROUP BY fiscal_year, fiscal_month
          ORDER BY fiscal_year, fiscal_month
        )
        SELECT jsonb_agg(
            jsonb_build_object(
                'year', monthly_totals.fiscal_year,
                'month', monthly_totals.fiscal_month,
                'total', monthly_totals.total
            )
        ) AS result
        FROM monthly_totals;
        `);

        return (
          dbResult?.result?.reduce(
            (valuesByYear, val) => {
              if (!valuesByYear[val.year]) {
                valuesByYear[val.year] = [];
              }

              valuesByYear[val.year].push({ month: val.month, total: val.total });

              return valuesByYear;
            },
            {} as Record<string, Record<string, number>[]>,
          ) ?? {}
        );
      }),

    getMonthlyActualsByProjectObjectId: t.procedure
      .input(
        z.object({
          projectObjectId: z.string(),
          startYear: z.number().int(),
          endYear: z.number().int(),
        }),
      )
      .query(async ({ input }) => {
        const result = await refreshProjectObjectSapActuals(
          { start: input.startYear, end: input.endYear },
          input.projectObjectId,
        );

        if (!result) {
          return null;
        }

        const returnSchema = z.object({
          result: z.array(z.object({ year: z.number(), month: z.number(), total: z.number() })),
        });
        const dbResult = await getPool().maybeOne(sql.type(returnSchema)`
          WITH monthly_totals AS (
            SELECT
              fiscal_year,
              EXTRACT(MONTH FROM posting_date) AS fiscal_month,
              sum(value_in_currency_subunit) AS total
            FROM app.sap_actuals_item
            WHERE wbs_element_id = ${result.wbsId}
              AND fiscal_year >= ${input.startYear}
              AND fiscal_year <= ${result.endYear}
              AND (document_type IS NULL OR document_type <> 'AA')
            GROUP BY fiscal_year, fiscal_month
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'year', monthly_totals.fiscal_year,
                  'month', monthly_totals.fiscal_month,
                  'total', monthly_totals.total
              )
          ) AS result
          FROM monthly_totals;
          `);

        return (
          dbResult?.result?.reduce(
            (valuesByYear, val) => {
              if (!valuesByYear[val.year]) {
                valuesByYear[val.year] = [];
              }

              valuesByYear[val.year].push({ month: val.month, total: val.total });

              return valuesByYear;
            },
            {} as Record<string, Record<string, number>[]>,
          ) ?? {}
        );
      }),

    doesSapProjectIdExist: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        return await sapProjectExists(input.projectId);
      }),
  });
