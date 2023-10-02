import { EXPLICIT_EMPTY } from 'tre-hanna-shared/src/schema/code';
import { z } from 'zod';

import {
  getBlanketContractReport,
  getBlanketContractReportRowCount,
  getBlanketContractReportSummary,
} from '@backend/components/sap/blanketContractReport';
import { startBlanketContractReportJob } from '@backend/components/sap/blanketContractReportQueue';
import {
  getEnvironmentCodeReport,
  getEnvironmentCodeReportRowCount,
  getEnvironmentCodeReportSummary,
} from '@backend/components/sap/environmentCodeReport';
import { startEnvironmentCodeReportJob } from '@backend/components/sap/environmentCodeReportQueue';
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

    getEnvironmentCodeReportRowCount: t.procedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        return await getEnvironmentCodeReportRowCount(input);
      }),
    getEnvironmentCodeReportSummary: t.procedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        return await getEnvironmentCodeReportSummary(input);
      }),

    startEnvironmentCodeReportJob: t.procedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        return await startEnvironmentCodeReportJob(input);
      }),

    getBlanketContractReport: t.procedure
      .input(blanketContractReportQuerySchema)
      .query(async ({ input }) => {
        return await getBlanketContractReport(input);
      }),

    getBlanketContractReportRowCount: t.procedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        return await getBlanketContractReportRowCount(input);
      }),

    getBlanketContractReportSummary: t.procedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        return await getBlanketContractReportSummary(input);
      }),

    startBlanketContractReportJob: t.procedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        return await startBlanketContractReportJob(input);
      }),

    getPlants: t.procedure.query(async () => {
      const { rows } = await getPool().query(sql.type(z.object({ plant: z.string() }))`
        SELECT DISTINCT plant FROM app.sap_wbs
        WHERE plant IS NOT NULL
        ORDER BY plant ASC
      `);
      const plants = rows.map((row) => row.plant);
      return [EXPLICIT_EMPTY, ...plants];
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
