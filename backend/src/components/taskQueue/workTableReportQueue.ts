import { Workbook } from 'excel4node';

import { getCodesForCodeList } from '@backend/components/code';
import { buildSheet } from '@backend/components/report';
import { saveReportFile } from '@backend/components/report/report-file';
import { getAllUsers } from '@backend/components/user';
import { env } from '@backend/env';
import { workTableSearch } from '@backend/router/workTable';

import { TranslationKey, translations } from '@shared/language';
import { Code } from '@shared/schema/code';
import {
  WorkTableSearch,
  workTableColumnCodeKeys,
  workTableColumnCodes,
} from '@shared/schema/workTable';
import { Suffix } from '@shared/util-types';

import { getTaskQueue, startJob } from '.';

const queueName = 'work-table-report';

type JobData = WorkTableSearch;

type ReportColumnKey = Partial<Suffix<TranslationKey, 'workTable.export.'>>;

export async function setupWorkTableReportQueue() {
  getTaskQueue().work<JobData>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      const users = await getAllUsers();
      const workTableData = await workTableSearch(data);
      const workbook = new Workbook({
        dateFormat: 'd.m.yyyy',
      });

      const headers = Object.keys(workTableData[0]).reduce(
        (headers, key) => {
          switch (key) {
            case 'dateRange':
              return {
                ...headers,
                startDate: translations['fi']['workTable.export.startDate'],
                endDate: translations['fi']['workTable.export.endDate'],
              };
            case 'projectLink':
              return {
                ...headers,
                projectName: translations['fi']['workTable.export.projectName'],
              };
            case 'operatives':
              return {
                ...headers,
                rakennuttajaUser: translations['fi']['workTable.export.rakennuttajaUser'],
                suunnitteluttajaUser: translations['fi']['workTable.export.suunnitteluttajaUser'],
              };
            default:
              return {
                ...headers,
                [key]: translations['fi'][`workTable.export.${key as ReportColumnKey}`],
              };
          }
        },
        {} as { [key in ReportColumnKey]: string },
      );

      const codes = await Object.keys(workTableData[0]).reduce(
        async (codesObjectPromise, headerKey) => {
          const codesObject = await codesObjectPromise;
          if (workTableColumnCodeKeys.safeParse(headerKey).success) {
            const codeListId = workTableColumnCodes[headerKey as keyof typeof workTableColumnCodes];
            const codesForCodeList = await getCodesForCodeList(codeListId);
            return { ...codesObject, [headerKey]: codesForCodeList };
          }
          return codesObject;
        },

        {} as Promise<Record<keyof typeof workTableColumnCodes, Code[]>>,
      );

      function formatIdArrayToText(value: string[], codeKey: keyof typeof workTableColumnCodes) {
        return value
          .map((id) => codes[codeKey].find((code) => code.id.id === id)?.text['fi'])
          .join(', ');
      }

      const sheet = buildSheet<ReportColumnKey>({
        workbook,
        sheetTitle: translations['fi']['workTable.export.label'],
        rows: workTableData.map((row) => {
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            id,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            permissionCtx,
            dateRange,
            projectLink,
            operatives,
            objectType,
            objectCategory,
            objectUsage,
            budget,
            actual,
            forecast,
            kayttosuunnitelmanMuutos,
            lifecycleState,
            ...rest
          } = row;
          return {
            projectName: projectLink.projectName,
            ...rest,
            lifecycleState: codes.lifecycleState.find((code) => code.id.id === lifecycleState)
              ?.text['fi'],
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            objectType: formatIdArrayToText(objectType, 'objectType'),
            objectCategory: formatIdArrayToText(objectCategory, 'objectCategory'),
            objectUsage: formatIdArrayToText(objectUsage, 'objectUsage'),
            rakennuttajaUser:
              users.find((user) => user.id === operatives.rakennuttajaUser)?.name ?? null,
            suunnitteluttajaUser:
              users.find((user) => user.id === operatives.suunnitteluttajaUser)?.name ?? null,
            budget: budget == null ? null : budget / 100,
            actual: actual == null ? null : actual / 100,
            forecast: forecast == null ? null : forecast / 100,
            kayttosuunnitelmanMuutos:
              kayttosuunnitelmanMuutos == null ? null : kayttosuunnitelmanMuutos / 100,
          };
        }),
        headers: headers,
        types: {
          budget: 'currency',
          actual: 'currency',
          forecast: 'currency',
          kayttosuunnitelmanMuutos: 'currency',
        },
        sum: ['budget', 'actual', 'forecast', 'kayttosuunnitelmanMuutos'],
      });

      if (!sheet) {
        return;
      }

      await saveReportFile(id, 'investoinnit.xlsx', workbook);
    },
  );
}

export async function startWorkTableReportJob(data: JobData) {
  return startJob(queueName, data);
}
