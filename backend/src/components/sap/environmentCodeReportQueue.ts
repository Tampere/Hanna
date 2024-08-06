import { Workbook } from 'excel4node';

import { env } from '@backend/env.js';

import { TranslationKey, translations } from '@shared/language/index.js';
import { EnvironmentCodeReportQuery } from '@shared/schema/sapReport.js';
import { Suffix } from '@shared/util-types.js';

import { buildSheet } from '../report/index.js';
import { saveReportFile } from '../report/report-file.js';
import { getTaskQueue, startJob } from '../taskQueue/index.js';
import { getEnvironmentCodeReport } from './environmentCodeReport.js';

const queueName = 'environment-code-report';

type JobData = Pick<EnvironmentCodeReportQuery, 'filters'>;

type ReportColumnKey = Partial<Suffix<TranslationKey, 'sapReports.environmentCodes.'>>;
type ActualsReportColumnKey = Partial<
  Suffix<TranslationKey, 'sapReports.environmentCodes.actualEntries.'>
>;

export async function setupEnvironmentCodeReportQueue() {
  getTaskQueue().work<JobData>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      const rows = await getEnvironmentCodeReport({ filters: data.filters });
      const workbook = new Workbook({
        dateFormat: 'd.m.yyyy',
      });

      const headers = Object.keys(rows[0]).reduce(
        (headers, key) => {
          if (key === 'actualEntries') {
            return headers;
          }
          return {
            ...headers,
            [key]: translations['fi'][`sapReports.environmentCodes.${key as ReportColumnKey}`],
          };
        },
        {} as { [key in ReportColumnKey]: string },
      );

      const actualsHeaders = Object.keys(rows[0]).reduce(
        (headers, key) => {
          if (key === 'actualEntries') {
            return {
              ...headers,
              companyCode:
                translations['fi'][`sapReports.environmentCodes.actualEntries.companyCode`],
              companyCodeText:
                translations['fi'][`sapReports.environmentCodes.actualEntries.companyCodeText`],
            };
          }
          return {
            ...headers,
            [key]: translations['fi'][`sapReports.environmentCodes.${key as ReportColumnKey}`],
          };
        },
        {} as { [key in ReportColumnKey | ActualsReportColumnKey]: string },
      );

      const sheet = buildSheet({
        workbook,
        sheetTitle: translations['fi']['sapReports.environmentCodes.byWps'],
        // Convert data for Excel export
        rows: rows.map((row) => ({
          ...row,
          totalDebit: row.totalDebit == null ? null : row.totalDebit / 100,
          totalCredit: row.totalCredit == null ? null : row.totalCredit / 100,
          totalActuals: row.totalActuals == null ? null : row.totalActuals / 100,
        })),
        headers,
        types: { totalDebit: 'currency', totalCredit: 'currency', totalActuals: 'currency' },
        sum: ['totalDebit', 'totalCredit', 'totalActuals'],
      });

      const actualsSheet = buildSheet({
        workbook,
        sheetTitle: translations['fi']['sapReports.environmentCodes.byCompanies'],
        rows: rows.flatMap((row) =>
          row.actualEntries.map((subRow) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { actualEntries, company, ...rest } = row;
            return {
              companyCode: subRow.company.companyCode,
              companyCodeText: subRow.company.companyCodeText,
              ...rest,
              totalDebit: subRow.totalDebit == null ? null : subRow.totalDebit / 100,
              totalCredit: subRow.totalCredit == null ? null : subRow.totalCredit / 100,
              totalActuals: subRow.totalActuals == null ? null : subRow.totalActuals / 100,
            };
          }),
        ),
        headers: actualsHeaders,
        types: { totalDebit: 'currency', totalCredit: 'currency', totalActuals: 'currency' },
      });

      if (!sheet || !actualsSheet) {
        return;
      }

      await saveReportFile(id, 'ymparistokoodit.xlsx', workbook);
    },
  );
}

export async function startEnvironmentCodeReportJob(data: JobData) {
  return startJob(queueName, data);
}
