import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { blanketContractReportFilterAtom } from '@frontend/stores/sapReport/blanketContractReportFilters';
import { useDebounce } from '@frontend/utils/useDebounce';

import { BlanketContractReportFilters } from './BlanketContractReportFilters';

export function BlanketContractReport() {
  const { sapReport } = trpc.useContext();

  const tr = useTranslations();

  const filters = useAtomValue(blanketContractReportFilterAtom);

  return (
    <>
      <BlanketContractReportFilters />
      <DataTable
        getRows={sapReport.getBlanketContractReport.fetch}
        getSummary={sapReport.getBlanketContractReportSummary.fetch}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        filters={{
          ...filters,
          text: useDebounce(filters.text, 250),
          blanketOrderId: useDebounce(filters.blanketOrderId, 250),
        }}
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
            title: tr('sapReports.blanketContracts.contractPriceInCurrencySubunit'),
            format(value) {
              return formatCurrency(value);
            },
            align: 'right',
          },
          totalActuals: {
            title: tr('sapReports.blanketContracts.totalActuals'),
            format(value) {
              return formatCurrency(value ?? null);
            },
            align: 'right',
          },
        }}
      />
    </>
  );
}
