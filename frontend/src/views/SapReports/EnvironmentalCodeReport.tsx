import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { numericValueToText } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { EnvironmentalCodeReportFilters } from './EnvironmentalCodeReportFilters';

export function EnvironmentalCodeReport() {
  const { sap } = trpc.useContext();

  const tr = useTranslations();
  return (
    <>
      <EnvironmentalCodeReportFilters />
      <DataTable
        getRows={sap.getEnvironmentCodeReport.fetch}
        getRowCount={sap.getEnvironmentCodeReportRowCount.fetch}
        rowsPerPageOptions={[20, 50, 100]}
        defaultRowsPerPage={20}
        filters={{}}
        columns={{
          projectId: {
            title: tr('sapReports.environmentCodes.projectId'),
          },
          plant: {
            title: tr('sapReports.environmentCodes.plant'),
            width: 50,
          },
          wbsId: {
            title: tr('sapReports.environmentCodes.wbsId'),
          },
          wbsName: {
            title: tr('sapReports.environmentCodes.wbsName'),
            width: 400,
          },
          totalActuals: {
            title: tr('sapReports.environmentCodes.totalActuals'),
            format(value) {
              return numericValueToText(value);
            },
            align: 'right',
          },
          reasonForEnvironmentalInvestment: {
            title: tr('sapReports.environmentCodes.reasonForEnvironmentalInvestment'),
            align: 'right',
          },
          companyCode: {
            title: tr('sapReports.environmentCodes.companyCode'),
            align: 'right',
          },
        }}
      />
    </>
  );
}
