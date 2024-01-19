import { TRPCError } from '@trpc/server';
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
import { env } from '@backend/env';

import {
  blanketContractReportFilterSchema,
  blanketContractReportQuerySchema,
  environmentCodeReportFilterSchema,
  environmentCodeReportQuerySchema,
} from '@shared/schema/sapReport';

import { TRPC } from '.';

export const createSapReportRouter = (t: TRPC) => {
  const baseProcedure = t.procedure.use(async (opts) => {
    if (env.enabledFeatures.sapSync) {
      return opts.next();
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'SAP report feature is disabled',
      });
    }
  });

  return t.router({
    getLastSyncedAt: baseProcedure.query(async () => {
      return await getLastSyncedAt();
    }),

    getEnvironmentCodeReport: baseProcedure
      .input(environmentCodeReportQuerySchema)
      .query(async ({ input }) => {
        return await getEnvironmentCodeReport(input);
      }),

    getEnvironmentCodeReportRowCount: baseProcedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        return await getEnvironmentCodeReportRowCount(input);
      }),
    getEnvironmentCodeReportSummary: baseProcedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        return await getEnvironmentCodeReportSummary(input);
      }),

    startEnvironmentCodeReportJob: baseProcedure
      .input(environmentCodeReportFilterSchema)
      .query(async ({ input }) => {
        return await startEnvironmentCodeReportJob(input);
      }),

    getBlanketContractReport: baseProcedure
      .input(blanketContractReportQuerySchema)
      .query(async ({ input }) => {
        return await getBlanketContractReport(input);
      }),

    getBlanketContractReportRowCount: baseProcedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        return await getBlanketContractReportRowCount(input);
      }),

    getBlanketContractReportSummary: baseProcedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        return await getBlanketContractReportSummary(input);
      }),

    startBlanketContractReportJob: baseProcedure
      .input(blanketContractReportFilterSchema)
      .query(async ({ input }) => {
        return await startBlanketContractReportJob(input);
      }),

    getBlanketOrderIds: baseProcedure.input(z.object({})).query(async () => {
      const { rows } = await getPool().query(sql.type(z.object({ blanketOrderId: z.string() }))`
        SELECT DISTINCT blanket_order_id AS "blanketOrderId"
        FROM app.sap_wbs
        LEFT JOIN app.sap_network network ON sap_wbs.wbs_internal_id = network.wbs_internal_id
        LEFT JOIN app.sap_project project ON project.sap_project_internal_id = network.sap_project_internal_id
        WHERE blanket_order_id IS NOT NULL AND
              network.network_id IS NOT NULL AND
              project.system_status = 'VAPA'
        ORDER BY blanket_order_id ASC
      `);
      return rows.map((row) => row.blanketOrderId);
    }),

    getYears: baseProcedure.query(async () => {
      const { rows } = await getPool().query(
        sql.type(z.object({ year: z.number() }))`
          SELECT DISTINCT fiscal_year "year" FROM app.sap_actuals_item
          WHERE fiscal_year IS NOT NULL
          ORDER BY fiscal_year DESC
        `
      );
      return rows.map((row) => row.year);
    }),

    getConsultCompanies: baseProcedure.query(async () => {
      const { rows } = await getPool().query(sql.type(z.object({ name: z.string() }))`
        SELECT DISTINCT consult_company AS "name" FROM app.sap_wbs
        WHERE consult_company IS NOT NULL
        ORDER BY consult_company ASC
      `);
      return rows.map((row) => row.name);
    }),
  });
};
