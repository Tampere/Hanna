import { z } from 'zod';

import {
  refreshAllProjectObjectSapActuals,
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
import { SapTask, sapTaskSchema } from '@shared/schema/task.js';

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
  WITH yearly_totals_by_wbs as (SELECT fiscal_year, wbs_element_id, sum(value_in_currency_subunit) AS total
  FROM app.sap_actuals_item
  WHERE sap_project_id IN (
      SELECT sap_project_id
      FROM app.project
      WHERE id = ${input.projectId}
  ) AND fiscal_year >= ${input.startYear}
    AND fiscal_year <= ${endYear}
    AND document_type <> 'AA'
  GROUP BY fiscal_year, wbs_element_id),
  yearly_totals_by_committee as (
  	SELECT ytbc.fiscal_year, (poc.committee_type).id as committee_id, sum(ytbc.total) as total FROM
  		yearly_totals_by_wbs ytbc
  			LEFT join app.project_object po on ytbc.wbs_element_id = po.sap_wbs_id
  			left join app.project_object_committee poc on po.id = poc.project_object_id
  	where poc.committee_type is not null
  	group by ytbc.fiscal_year, poc.committee_type
  	order by ytbc.fiscal_year, poc.committee_type
  ),
  overall_yearly_totals AS ( -- Calculate the overall yearly totals
    SELECT
      fiscal_year,
      sum(total) AS total
    FROM
      yearly_totals_by_wbs
    GROUP BY
      fiscal_year
    order by fiscal_year
  ),
committee_json AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'year', fiscal_year,
      'committeeId', committee_id,
      'total', total
    )
  ) AS byCommittee
  FROM yearly_totals_by_committee
),
yearly_totals_json AS (
  SELECT jsonb_agg(
    jsonb_build_object(
      'year', fiscal_year,
      'total', total
    )
  ) AS yearlyActuals
  FROM overall_yearly_totals
)
SELECT jsonb_build_object(
  'byCommittee', cj.byCommittee,
  'yearlyActuals', yj.yearlyActuals
) AS result
FROM committee_json cj, yearly_totals_json yj;
        `);
        console.log(dbResult?.result);
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
              AND document_type <> 'AA'
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
            AND document_type <> 'AA'
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
              AND document_type <> 'AA'
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

    getWbsActualsByNetworkActivity: t.procedure
      .input(z.object({ projectObjectId: z.string() }))
      .query(async ({ input }) => {
        const result = await refreshAllProjectObjectSapActuals(input.projectObjectId);
        if (!result) {
          return null;
        }

        const dbResult = await getPool().maybeOne(sql.type(
          z.object({ result: z.array(sapTaskSchema) }),
        )`
           WITH activity_totals AS (
            SELECT
            	sai.activity_id,
            	sa.short_description,
              sum(sai.value_in_currency_subunit) AS total,
              wbs_id,
              sai.network_id
            FROM app.sap_actuals_item sai
            LEFT JOIN app.sap_wbs w ON w.wbs_id = sai.wbs_element_id
            LEFT JOIN app.sap_activity sa
            	ON sa.network_id = sai.network_id
            		AND sa.wbs_internal_id = w.wbs_internal_id
            		AND sa.activity_number = sai.activity_id
            WHERE wbs_element_id = ${result.wbsId}
              AND document_type <> 'AA'
              AND object_type = 'NV' -- Tells that actual is for network activity, not WBS
            GROUP BY wbs_id, sai.network_id, sai.activity_id, sa.short_description
          )
          SELECT jsonb_agg(
              jsonb_build_object(
                  'activityId', activity_totals.activity_id,
                  'description', activity_totals.short_description,
                  'total', activity_totals.total,
                  'wbsId', activity_totals.wbs_id,
                  'networkId', activity_totals.network_id
              )
          ) AS result
          FROM activity_totals;
          `);

        return dbResult?.result ?? ([] as SapTask[]);
      }),

    doesSapProjectIdExist: t.procedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        return await sapProjectExists(input.projectId);
      }),
  });
