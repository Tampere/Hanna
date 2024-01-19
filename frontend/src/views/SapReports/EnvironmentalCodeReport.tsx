import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { useDebouncedEnvironmentalCodeReportFilters } from '@frontend/stores/sapReport/environmentalCodeReportFilters';

import { EnvironmentalCodeReportFilters } from './EnvironmentalCodeReportFilters';

function isInternalCompany(companyId: string) {
  return /^[12]\d{3}$/.test(companyId);
}

export function EnvironmentalCodeReport() {
  const { sapReport } = trpc.useContext();

  const filters = useDebouncedEnvironmentalCodeReportFilters();

  const tr = useTranslations();
  return (
    <>
      <EnvironmentalCodeReportFilters />
      <DataTable
        getRows={sapReport.getEnvironmentCodeReport.fetch}
        getRowCount={sapReport.getEnvironmentCodeReportRowCount.fetch}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        filters={filters}
        columns={{
          projectId: {
            title: tr('sapReports.environmentCodes.projectId'),
          },
          wbsId: {
            title: tr('sapReports.environmentCodes.wbsId'),
          },
          wbsName: {
            title: tr('sapReports.environmentCodes.wbsName'),
            width: 400,
          },
          reasonForEnvironmentalInvestment: {
            title: tr('sapReports.environmentCodes.reasonForEnvironmentalInvestment'),
            align: 'right',
          },
          reasonForEnvironmentalInvestmentText: {
            title: tr('sapReports.environmentCodes.reasonForEnvironmentalInvestmentText'),
            align: 'right',
          },
          companyCode: {
            title: tr('sapReports.environmentCodes.companyCode'),
            align: 'right',
            format(value) {
              if (!value) {
                return '';
              } else {
                return value && isInternalCompany(value) ? value : tr('sapReports.externalCompany');
              }
            },
          },
          companyCodeText: {
            title: tr('sapReports.environmentCodes.companyCodeText'),
            align: 'right',
            format(value, row) {
              return row?.companyCode && isInternalCompany(row.companyCode) ? value : '';
            },
          },
          totalDebit: {
            title: tr('sapReports.environmentCodes.totalDebit'),
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalCredit: {
            title: tr('sapReports.environmentCodes.totalCredit'),
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalActuals: {
            title: tr('sapReports.environmentCodes.totalActuals'),
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
        }}
      />
    </>
  );
}
