import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { environmentalCodeReportFilterAtom } from '@frontend/stores/sapReport/environmentalCodeReportFilters';
import { useDebounce } from '@frontend/utils/useDebounce';

import { EnvironmentalCodeReportFilters } from './EnvironmentalCodeReportFilters';

function isInternalCompany(companyId: string) {
  return /^[12]\d{3}$/.test(companyId);
}

export function EnvironmentalCodeReport() {
  const { sapReport } = trpc.useContext();

  const filters = useAtomValue(environmentalCodeReportFilterAtom);

  const tr = useTranslations();
  return (
    <>
      <EnvironmentalCodeReportFilters />
      <DataTable
        getRows={sapReport.getEnvironmentCodeReport.fetch}
        getSummary={sapReport.getEnvironmentCodeReportSummary.fetch}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        filters={{
          ...filters,
          text: useDebounce(filters.text, 250),
        }}
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
              return isInternalCompany(value) ? value : tr('sapReports.externalCompany');
            },
          },
          companyCodeText: {
            title: tr('sapReports.environmentCodes.companyCodeText'),
            align: 'right',
            format(value, row) {
              return row != null && isInternalCompany(row.companyCode) ? value : '';
            },
          },
          totalActuals: {
            title: tr('sapReports.environmentCodes.totalActuals'),
            align: 'right',
            format(value) {
              return formatCurrency(value);
            },
          },
        }}
      />
    </>
  );
}
