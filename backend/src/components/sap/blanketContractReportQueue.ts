import { Workbook } from 'excel4node';
import { TranslationKey, translations } from 'tre-hanna-shared/src/language';
import { BlanketContractReportQuery } from 'tre-hanna-shared/src/schema/sapReport';
import { Suffix } from 'tre-hanna-shared/src/util-types';

import { env } from '@backend/env';

import { buildSheet } from '../report';
import { saveReportFile } from '../report/report-file';
import { getTaskQueue, startJob } from '../taskQueue';
import { getBlanketContractReport } from './blanketContractReport';

const queueName = 'blanket-contract-report';

type JobData = Pick<BlanketContractReportQuery, 'filters'>;

type ReportColumnKey = Partial<Suffix<TranslationKey, 'sapReports.blanketContracts.'>>;

export async function setupBlanketContractReportQueue() {
  getTaskQueue().work<JobData>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      const rows = await getBlanketContractReport({ filters: data.filters });
      const workbook = new Workbook({
        dateFormat: 'd.m.yyyy',
      });

      const headers = Object.keys(rows[0]).reduce(
        (headers, key) => ({
          ...headers,
          [key]: translations['fi'][`sapReports.blanketContracts.${key as ReportColumnKey}`],
        }),
        {} as { [key in ReportColumnKey]: string }
      );

      const sheet = buildSheet({
        workbook,
        sheetTitle: translations['fi']['sapReports.environmentCodes'],
        // Convert data for Excel export
        rows: rows.map((row) => ({
          ...row,
          contractPriceInCurrencySubunit: row.contractPriceInCurrencySubunit / 100,
          totalActuals: row.totalActuals == null ? null : row.totalActuals / 100,
        })),
        headers,
        sum: ['totalActuals'],
      });

      if (!sheet) {
        return;
      }

      await saveReportFile(id, 'puitesopimukset.xlsx', workbook);
    }
  );
}

export async function startBlanketContractReportJob(data: JobData) {
  return startJob(queueName, data);
}
