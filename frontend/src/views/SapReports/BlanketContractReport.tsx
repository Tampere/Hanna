import { useState } from 'react';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { useDebouncedBlanketContractReportFilters } from '@frontend/stores/sapReport/blanketContractReportFilters';

import { BlanketContractReportFilters } from './BlanketContractReportFilters';

export function BlanketContractReport() {
  const { sapReport } = trpc.useUtils();

  const tr = useTranslations();
  const [dataRows, setDataRows] = useState<number | null>(null);
  const filters = useDebouncedBlanketContractReportFilters();

  return (
    <>
      <BlanketContractReportFilters disableExport={!dataRows || dataRows === 0} />
      <DataTable
        getRows={sapReport.getBlanketContractReport.fetch}
        getRowCount={async (params) => {
          const result = await sapReport.getBlanketContractReportRowCount.fetch(params);
          setDataRows(result.rowCount);
          return result;
        }}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        filters={filters}
        columns={{
          projectId: {
            title: tr('sapReports.blanketContracts.projectId'),
            collapsible: false,
          },
          networkId: {
            title: tr('sapReports.blanketContracts.networkId'),
            collapsible: false,
          },
          networkName: {
            title: tr('sapReports.blanketContracts.networkName'),
            collapsible: false,
          },
          projectManagerName: {
            title: tr('sapReports.blanketContracts.projectManagerName'),
            collapsible: false,
          },
          consultCompany: {
            title: tr('sapReports.blanketContracts.consultCompany'),
            collapsible: false,
          },
          decisionMaker: {
            title: tr('sapReports.blanketContracts.decisionMaker'),
            collapsible: false,
          },
          decisionDateText: {
            title: tr('sapReports.blanketContracts.decisionDateText'),
            collapsible: false,
            align: 'right',
          },
          blanketOrderId: {
            title: tr('sapReports.blanketContracts.blanketOrderId'),
            collapsible: false,
            align: 'left',
          },
          contractPriceInCurrencySubunit: {
            title: tr('sapReports.blanketContracts.contractPriceInCurrencySubunit'),
            collapsible: false,
            format(value) {
              return formatCurrency(value);
            },
            align: 'right',
            type: 'currency',
          },
          totalDebit: {
            title: tr('sapReports.blanketContracts.totalDebit'),
            collapsible: false,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalCredit: {
            title: tr('sapReports.blanketContracts.totalCredit'),
            collapsible: false,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalActuals: {
            title: tr('sapReports.blanketContracts.totalActuals'),
            collapsible: false,
            format(value) {
              return formatCurrency(value ?? 0);
            },
            align: 'right',
            type: 'currency',
          },
        }}
      />
    </>
  );
}
