import { Workbook } from 'excel4node';

import { env } from '@backend/env';

import { TranslationKey, translations } from '@shared/language';
import { EnvironmentCodeReportQuery } from '@shared/schema/sapReport';
import { Suffix } from '@shared/util-types';

import { buildSheet } from '../report';
import { saveReportFile } from '../report/report-file';
import { getTaskQueue, startJob } from '../taskQueue';
import { getEnvironmentCodeReport } from './environmentCodeReport';

const queueName = 'environment-code-report';

type JobData = Pick<EnvironmentCodeReportQuery, 'filters'>;

type ReportColumnKey = Partial<Suffix<TranslationKey, 'sapReports.environmentCodes.'>>;

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
        (headers, key) => ({
          ...headers,
          [key]: translations['fi'][`sapReports.environmentCodes.${key as ReportColumnKey}`],
        }),
        {} as { [key in ReportColumnKey]: string }
      );

      const sheet = buildSheet({
        workbook,
        sheetTitle: translations['fi']['sapReports.environmentCodes'],
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

      if (!sheet) {
        return;
      }

      await saveReportFile(id, 'ymparistokoodit.xlsx', workbook);
    }
  );
}

export async function startEnvironmentCodeReportJob(data: JobData) {
  return startJob(queueName, data);
}
