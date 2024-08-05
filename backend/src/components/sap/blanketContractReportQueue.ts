import { Workbook } from 'excel4node';

import { env } from '@backend/env';

import { TranslationKey, translations } from '@shared/language';
import { BlanketContractReportQuery } from '@shared/schema/sapReport';
import { Suffix } from '@shared/util-types';

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
        {} as { [key in ReportColumnKey]: string },
      );

      const sheet = buildSheet({
        workbook,
        sheetTitle: translations['fi']['sapReports.environmentCodes'],
        // Convert data for Excel export
        rows: rows.map((row) => ({
          ...row,
          contractPriceInCurrencySubunit: row.contractPriceInCurrencySubunit / 100,
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

      await saveReportFile(id, 'puitesopimukset.xlsx', workbook);
    },
  );
}

export async function startBlanketContractReportJob(data: JobData) {
  return startJob(queueName, data);
}
