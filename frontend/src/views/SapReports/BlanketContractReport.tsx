import dayjs from 'dayjs';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency, numericValueToText } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { BlanketContractReportFilters } from './BlanketContractReportFilters';

export function BlanketContractReport() {
  const { sap } = trpc.useContext();

  const tr = useTranslations();
  return (
    <>
      <BlanketContractReportFilters />
      <DataTable
        getRows={sap.getBlanketContractReport.fetch}
        getSummary={sap.getBlanketContractReportSummary.fetch}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        defaultRowsPerPage={10}
        filters={{}}
        columns={{
          projectId: {
            title: tr('sapReports.blanketContracts.projectId'),
          },
          networkId: {
            title: tr('sapReports.blanketContracts.networkId'),
          },
          networkName: {
            title: tr('sapReports.blanketContracts.networkName'),
          },
          projectManagerName: {
            title: tr('sapReports.blanketContracts.projectManagerName'),
          },
          consultCompany: {
            title: tr('sapReports.blanketContracts.consultCompany'),
          },
          decisionMaker: {
            title: tr('sapReports.blanketContracts.decisionMaker'),
          },
          decisionDateText: {
            title: tr('sapReports.blanketContracts.decisionDateText'),
            align: 'right',
          },
          blanketOrderId: {
            title: tr('sapReports.blanketContracts.blanketOrderId'),
            align: 'right',
          },
          contractPriceInCurrencySubunit: {
            title: tr('sapReports.blanketContracts.contractPrice'),
            format(value) {
              return formatCurrency(value);
            },
            align: 'right',
          },
          totalActuals: {
            title: tr('sapReports.blanketContracts.totalActuals'),
            format(value) {
              return formatCurrency(value);
            },
            align: 'right',
          },
        }}
      />
    </>
  );
}
