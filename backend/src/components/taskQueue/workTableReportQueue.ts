import dayjs from 'dayjs';
import { Workbook } from 'excel4node';
import { ProjectObjectUserRole } from 'tre-hanna-shared/src/schema/projectObject';

import { getCodesForCodeList } from '@backend/components/code';
import { buildSheet } from '@backend/components/report';
import { saveReportFile } from '@backend/components/report/report-file';
import { getAllUsers } from '@backend/components/user';
import { env } from '@backend/env';
import { getAllContactsAndCompanies } from '@backend/router/company';
import { workTableSearch } from '@backend/router/workTable';

import { reportDateFormat } from '@shared/date';
import { TranslationKey, translations } from '@shared/language';
import { Code } from '@shared/schema/code';
import {
  WorkTableRow,
  WorkTableSearch,
  templateColumns,
  workTableColumnCodeKeys,
  workTableColumnCodes,
} from '@shared/schema/workTable';
import { Suffix } from '@shared/util-types';

import { getTaskQueue, startJob } from '.';

const queueName = 'work-table-report';

type JobData = WorkTableSearch;

type ReportColumnKey = Exclude<Partial<Suffix<TranslationKey, 'workTable.export.'>>, 'label'>;

export async function setupWorkTableReportQueue() {
  getTaskQueue().work<JobData>(
    queueName,
    {
      teamSize: env.report.queueConcurrency,
      teamConcurrency: env.report.queueConcurrency,
    },
    async ({ id, data }) => {
      const users = await getAllUsers();
      const contacts = await getAllContactsAndCompanies();
      const workTableData = await workTableSearch(data);
      const workbook = new Workbook({
        dateFormat: 'd.m.yyyy',
      });

      const headers = Object.keys(workTableData[0]).reduce(
        (headers, key) => {
          switch (key) {
            case 'id':
            case 'permissionCtx':
              return headers;
            case 'projectDateRange':
              return {
                ...headers,
                projectStartDate: translations['fi']['workTable.export.projectStartDate'],
                projectEndDate: translations['fi']['workTable.export.projectEndDate'],
              };
            case 'objectDateRange':
              return {
                ...headers,
                objectStartDate: translations['fi']['workTable.export.objectStartDate'],
                objectEndDate: translations['fi']['workTable.export.objectEndDate'],
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

      function getUserRoleString(userId: string) {
        const user = users.find((u) => u.id === userId);
        return user ? `${user.name} (${translations['fi']['workTable.cityOfTampere']})` : null;
      }

      function getCompanyContactRoleString(contactId: string) {
        const contact = contacts.find((c) => c.id === contactId);
        return contact ? `${contact.contactName} (${contact.companyName})` : null;
      }

      function formatRolesToUsersAndContacts(roles: ProjectObjectUserRole[]) {
        return roles
          .flatMap((role) =>
            role.userIds
              .map(getUserRoleString)
              .concat(role.companyContactIds.map(getCompanyContactRoleString)),
          )
          .join(', ');
      }

      function formatRolesToText(roles: ProjectObjectUserRole[]) {
        return roles
          .map((role) => {
            const roleName =
              codes.objectRoles.find((code) => code.id.id === role.roleId)?.text['fi'] ?? '';
            return `${roleName}: ${role.userIds
              .map(getUserRoleString)
              .concat(role.companyContactIds.map(getCompanyContactRoleString))
              .join(', ')}`;
          })
          .join('; ');
      }

      const formatRows: Record<
        ReportColumnKey,
        (row: Omit<WorkTableRow, 'id' | 'permissionCtx'>) => string | number | undefined | null
      > = {
        projectName: (row) => row.projectLink.projectName,
        objectName: (row) => row.objectName,
        lifecycleState: (row) =>
          codes.lifecycleState.find((code) => code.id.id === row.lifecycleState)?.text['fi'],
        projectStartDate: (row) => dayjs(row.projectDateRange.startDate).format(reportDateFormat),
        projectEndDate: (row) => dayjs(row.projectDateRange.endDate).format(reportDateFormat),
        objectStartDate: (row) => dayjs(row.objectDateRange.startDate).format(reportDateFormat),
        objectEndDate: (row) => dayjs(row.objectDateRange.endDate).format(reportDateFormat),
        objectType: (row) => formatIdArrayToText(row.objectType, 'objectType'),
        objectCategory: (row) => formatIdArrayToText(row.objectCategory, 'objectCategory'),
        objectUsage: (row) => formatIdArrayToText(row.objectUsage, 'objectUsage'),
        rakennuttajaUser: (row) =>
          users.find((user) => user.id === row.operatives.rakennuttajaUser)?.name ?? null,
        suunnitteluttajaUser: (row) =>
          users.find((user) => user.id === row.operatives.suunnitteluttajaUser)?.name ?? null,
        budget: (row) => (row.budget == null ? null : row.budget / 100),
        actual: (row) => (row.actual == null ? null : row.actual / 100),
        forecast: (row) => (row.forecast == null ? null : row.forecast / 100),
        kayttosuunnitelmanMuutos: (row) =>
          row.kayttosuunnitelmanMuutos == null ? null : row.kayttosuunnitelmanMuutos / 100,
        sapWbsId: (row) => row.sapWbsId,
        sapProjectId: (row) => row.sapProjectId,
        companyContacts: (row) => formatRolesToUsersAndContacts(row.companyContacts),
        objectRoles: (row) => formatRolesToText(row.objectRoles),
      };

      function getRows() {
        return workTableData.map((row) => {
          return (Object.keys(headers) as ReportColumnKey[]).reduce(
            (formattedRow, columnKey) => {
              return {
                ...formattedRow,
                [columnKey]: formatRows[columnKey](row),
              };
            },
            {} as { [key in ReportColumnKey]: string },
          );
        });
      }

      const financeColumns = ['budget', 'actual', 'forecast', 'kayttosuunnitelmanMuutos'];

      const sheet = buildSheet<ReportColumnKey>({
        workbook,
        sheetTitle: translations['fi']['workTable.export.label'],
        rows: getRows(),
        headers: headers,
        types: {
          budget: 'currency',
          actual: 'currency',
          forecast: 'currency',
          kayttosuunnitelmanMuutos: 'currency',
        },
        sum: (data.reportTemplate && templateColumns[data.reportTemplate])?.filter((column) =>
          financeColumns.includes(column),
        ) as ReportColumnKey[],
      });

      if (!sheet) {
        return;
      }

      const workbookNames = {
        print: translations['fi']['workTable.printReport'],
        basic: translations['fi']['workTable.basicReport'],
        expences: translations['fi']['workTable.expencesReport'],
        roles: translations['fi']['workTable.rolesReport'],
      };

      await saveReportFile(id, `${workbookNames[data.reportTemplate ?? 'print']}.xlsx`, workbook);
    },
  );
}

export async function startWorkTableReportJob(data: JobData) {
  return startJob(queueName, data);
}
