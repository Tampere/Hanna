import { z } from 'zod';

import {
  getBlanketContractReport,
  getBlanketContractReportSummary,
} from '@backend/components/sap/blanketContractReport';
import {
  getEnvironmentCodeReport,
  getEnvironmentCodeReportSummary,
} from '@backend/components/sap/environmentCodeReport';
import { getLastSyncedAt } from '@backend/components/sap/syncQueue';
import { getPool, sql } from '@backend/db';

import {
  blanketContractReportFilterSchema,
  blanketContractReportQuerySchema,
  environmentCodeReportFilterSchema,
  environmentCodeReportQuerySchema,
} from '@shared/schema/sapReport';

import { TRPC } from '.';

export const createSapReportRouter = (t: TRPC) =>
  t.router({
    getLastSyncedAt: t.procedure.query(async () => {
      return await getLastSyncedAt();
    }),

    getEnvironmentCodeReport: t.procedure
      .input(environmentCodeReportQuerySchema)
      .query(async ({ input }) => {
        return await getEnvironmentCodeReport(input);
      }),

    getEnvironmentCodeReportSummary: t.procedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        const summary = await getEnvironmentCodeReportSummary(input);
        return {
          rowCount: summary.rowCount,
          sums: {
            totalActuals: summary.totalActualsSum,
          },
        };
      }),

    getBlanketContractReport: t.procedure
      .input(blanketContractReportQuerySchema)
      .query(async ({ input }) => {
        return await getBlanketContractReport(input);
      }),

    getBlanketContractReportSummary: t.procedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        const summary = await getBlanketContractReportSummary(input);
        return {
          rowCount: summary.rowCount,
          sums: {
            totalActuals: summary.totalActualsSum,
          },
        };
      }),

    getPlants: t.procedure.query(async () => {
      const { rows } = await getPool().query(sql.type(
        z.object({ id: z.string(), label: z.string() })
      )`
        WITH plant_ids AS (
          SELECT DISTINCT plant AS id FROM app.sap_wbs
          WHERE plant IS NOT NULL
        )
        SELECT
          plant_ids.id AS id,
          code.text_fi AS label
        FROM
          plant_ids
          LEFT JOIN app.code ON code.id = ('Kumppani', plant_ids.id)::app.code_id
      `);
      return rows;
    }),

    getYears: t.procedure.query(async () => {
      const { rows } = await getPool().query(
        sql.type(z.object({ year: z.number() }))`
          SELECT DISTINCT fiscal_year "year" FROM app.sap_actuals_item
          WHERE fiscal_year IS NOT NULL
          ORDER BY fiscal_year DESC
        `
      );
      return rows.map((row) => row.year);
    }),

    getConsultCompanies: t.procedure.query(async () => {
      const { rows } = await getPool().query(sql.type(z.object({ name: z.string() }))`
        SELECT DISTINCT consult_company AS "name" FROM app.sap_wbs
        WHERE consult_company IS NOT NULL
        ORDER BY consult_company ASC
      `);
      return rows.map((row) => row.name);
    }),
  });
