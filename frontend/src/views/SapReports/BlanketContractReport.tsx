import dayjs from 'dayjs';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { numericValueToText } from '@frontend/components/forms/CurrencyInput';
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
        getRowCount={sap.getBlanketContractReportRowCount.fetch}
        rowsPerPageOptions={[20, 50, 100]}
        defaultRowsPerPage={20}
        filters={{}}
        columns={{
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
              return numericValueToText(value);
            },
            align: 'right',
          },
          totalActuals: {
            title: tr('sapReports.blanketContracts.totalActuals'),
            format(value) {
              return numericValueToText(value);
            },
            align: 'right',
          },
        }}
      />
    </>
  );
}
