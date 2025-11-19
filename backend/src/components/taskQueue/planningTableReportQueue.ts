import { Workbook } from 'excel4node';
import { z } from 'zod';

import { buildSheet } from '@backend/components/report/index.js';
import { saveReportFile } from '@backend/components/report/report-file.js';
import { getTaskQueue, startJob } from '@backend/components/taskQueue/index.js';
import { getPool, sql } from '@backend/db.js';
import { env } from '@backend/env.js';
import { planningTableSearch } from '@backend/router/planning.js';

import { translations } from '@shared/language/index.js';
import { PlanningTableRow, PlanningTableSearch } from '@shared/schema/planningTable.js';

const queueName = 'planning-table-report';

type JobData = PlanningTableSearch;

type ExportRow = {
  projectName: string;
  projectObjectName: string | null;
} & Record<string, number | null>;

type ActualsByPoYear = Record<string, Record<number, number>>;

async function getActualsByProjectObjectIds(
  projectObjectIds: string[],
  startYear: number,
  endYear: number,
): Promise<ActualsByPoYear> {
  if (projectObjectIds.length === 0) {
    return {};
  }

  const currentYear = new Date().getFullYear();
  const endYearForActuals = Math.min(endYear, currentYear);

  if (endYearForActuals < startYear) {
    // Selected range is entirely in the future; there are no actuals to fetch.
    return {};
  }

  const rowSchema = z.object({
    projectObjectId: z.string(),
    year: z.number(),
    total: z.number(),
  });

  const rows = await getPool().any(
    sql.type(rowSchema)`
      SELECT
        po.id::text AS "projectObjectId",
        sai.fiscal_year AS "year",
        SUM(sai.value_in_currency_subunit) AS "total"
      FROM app.sap_actuals_item sai
      INNER JOIN app.project_object po ON po.sap_wbs_id = sai.wbs_element_id
      WHERE po.id = ANY(${sql.array(projectObjectIds, 'uuid')})
        AND sai.fiscal_year BETWEEN ${startYear} AND ${endYearForActuals}
        AND sai.document_type <> 'AA'
      GROUP BY po.id, sai.fiscal_year
    `,
  );

  const actualsByPoYear: ActualsByPoYear = {};
  rows.forEach((row) => {
    if (!actualsByPoYear[row.projectObjectId]) {
      actualsByPoYear[row.projectObjectId] = {};
    }
    actualsByPoYear[row.projectObjectId][row.year] = row.total;
  });

  return actualsByPoYear;
}

function buildExportRows(
  rows: PlanningTableRow[],
  startYear: number,
  endYear: number,
  actualsByPoYear: ActualsByPoYear,
): ExportRow[] {
  const projectObjectRows = rows.filter((row) => row.type === 'projectObject');
  const currentYear = new Date().getFullYear();

  return projectObjectRows.map((row) => {
    const exportRow: ExportRow = {
      projectName: row.projectName,
      projectObjectName: row.projectObjectName,
    } as ExportRow;

    const poActuals = actualsByPoYear[row.id] ?? {};

    for (let year = startYear; year <= endYear; year++) {
      const budgetForYear = row.budget?.find((b) => b?.year === year) ?? null;
      const amountInSubunit = budgetForYear?.amount ?? null;
      const actualInSubunit = poActuals[year] ?? null;

      // actuals (toteuma) only for current and past years
      if (year <= currentYear) {
        exportRow[`year${year}_actual`] = actualInSubunit == null ? null : actualInSubunit / 100;
      }

      // amount (arvio) for the year
      exportRow[`year${year}`] = amountInSubunit == null ? null : amountInSubunit / 100;
    }

    return exportRow;
  });
}

export async function setupPlanningTableReportQueue() {
  getTaskQueue().work<JobData>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      const planningRows = await planningTableSearch(data);

      if (!planningRows.length) {
        return;
      }

      const startYear = data.yearRange?.start ?? new Date().getFullYear();
      const endYear = data.yearRange?.end ?? startYear + 15;

      const projectObjectIds = planningRows
        .filter((row) => row.type === 'projectObject')
        .map((row) => row.id);

      const actualsByPoYear = await getActualsByProjectObjectIds(
        projectObjectIds,
        startYear,
        endYear,
      );

      const exportRows = buildExportRows(planningRows, startYear, endYear, actualsByPoYear);

      if (!exportRows.length) {
        return;
      }

      const workbook = new Workbook({
        dateFormat: 'd.m.yyyy',
      });

      const headers = Object.keys(exportRows[0]).reduce<Record<string, string>>((acc, key) => {
        if (key === 'projectName') {
          acc[key] = translations['fi']['workTable.export.projectName'];
        } else if (key === 'projectObjectName') {
          acc[key] = translations['fi']['workTable.export.objectName'];
        } else if (key.startsWith('year') && key.endsWith('_actual')) {
          const year = key.replace('year', '').replace('_actual', '');
          acc[key] = `${year} ${translations['fi']['planningTable.actual']}`;
        } else if (key.startsWith('year')) {
          const year = key.replace('year', '');
          acc[key] = `${year} ${translations['fi']['planningTable.amount']}`;
        } else {
          acc[key] = key;
        }
        return acc;
      }, {});

      const yearKeys = Object.keys(exportRows[0]).filter((key) => key.startsWith('year'));

      const types = yearKeys.reduce<Record<string, 'currency'>>((acc, key) => {
        acc[key] = 'currency';
        return acc;
      }, {});

      buildSheet<string>({
        workbook,
        sheetTitle: translations['fi']['planningTable.export.label'],
        rows: exportRows,
        headers,
        types,
        sum: yearKeys,
      });

      await saveReportFile(id, 'suunnittelutaulukko.xlsx', workbook);
    },
  );
}

export async function startPlanningTableReportJob(data: JobData) {
  return startJob(queueName, data);
}
