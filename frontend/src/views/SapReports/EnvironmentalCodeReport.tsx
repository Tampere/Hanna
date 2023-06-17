import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { EnvironmentalCodeReportFilters } from './EnvironmentalCodeReportFilters';

function isInternalCompany(companyId: string) {
  return /^[12]\d{3}$/.test(companyId);
}

export function EnvironmentalCodeReport() {
  const { sap } = trpc.useContext();

  const tr = useTranslations();
  return (
    <>
      <EnvironmentalCodeReportFilters />
      <DataTable
        getRows={sap.getEnvironmentCodeReport.fetch}
        getSummary={sap.getEnvironmentCodeReportSummary.fetch}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        defaultRowsPerPage={100}
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
            align: 'right',
            format(value) {
              return formatCurrency(value);
            },
          },
          reasonForEnvironmentalInvestment: {
            title: tr('sapReports.environmentCodes.reasonForEnvironmentalInvestment'),
            align: 'right',
          },
          companyCode: {
            title: tr('sapReports.environmentCodes.companyCode'),
            align: 'right',
            format(value) {
              return isInternalCompany(value) ? value : tr('sapReports.externalCompany');
            },
          },
          companyCodeTextFi: {
            title: tr('sapReports.environmentCodes.companyCodeText'),
            align: 'right',
            format(value, row) {
              return row != null && isInternalCompany(row.companyCode) ? value : '';
            },
          },
        }}
      />
    </>
  );
}
