import { useState } from 'react';

import { trpc } from '@frontend/client';
import { DataTable } from '@frontend/components/DataTable';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';
import { useDebouncedEnvironmentalCodeReportFilters } from '@frontend/stores/sapReport/environmentalCodeReportFilters';

import { EnvironmentalCodeReportFilters } from './EnvironmentalCodeReportFilters';

export function EnvironmentalCodeReport() {
  const { sapReport } = trpc.useUtils();

  const [dataRows, setDataRows] = useState<number | null>(null);
  const filters = useDebouncedEnvironmentalCodeReportFilters();

  const tr = useTranslations();
  return (
    <>
      <EnvironmentalCodeReportFilters disableExport={!dataRows || dataRows === 0} />
      <DataTable
        getRows={sapReport.getEnvironmentCodeReport.fetch}
        getRowCount={async (params) => {
          const result = await sapReport.getEnvironmentCodeReportRowCount.fetch(params);
          setDataRows(result.rowCount);
          return result;
        }}
        rowsPerPageOptions={[100, 200, 500, 1000]}
        filters={filters}
        columns={{
          projectId: {
            title: tr('sapReports.environmentCodes.projectId'),
            collapsible: false,
          },
          wbsId: {
            title: tr('sapReports.environmentCodes.wbsId'),
            collapsible: false,
          },
          wbsName: {
            title: tr('sapReports.environmentCodes.wbsName'),
            collapsible: false,
            width: 250,
            align: 'right',
          },
          reasonForEnvironmentalInvestment: {
            title: tr('sapReports.environmentCodes.reasonForEnvironmentalInvestment'),
            collapsible: false,
            align: 'right',
          },
          reasonForEnvironmentalInvestmentText: {
            title: tr('sapReports.environmentCodes.reasonForEnvironmentalInvestmentText'),
            collapsible: false,
            align: 'right',
            width: 200,
          },
          company: {
            title: tr('sapReports.environmentCodes.companies'),
            width: 300,
            collapsible: true,
          },
          totalDebit: {
            title: tr('sapReports.environmentCodes.totalDebit'),
            collapsible: true,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalCredit: {
            title: tr('sapReports.environmentCodes.totalCredit'),
            collapsible: true,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalActuals: {
            title: tr('sapReports.environmentCodes.totalActuals'),
            collapsible: true,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
        }}
        collapsedColumns={{
          totalCredit: {
            collapsible: false,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalDebit: {
            collapsible: false,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          totalActuals: {
            collapsible: false,
            align: 'right',
            format(value) {
              return formatCurrency(value ?? 0);
            },
            type: 'currency',
          },
          company: {
            collapsible: false,
            align: 'right',
            format(value) {
              if (!value?.companyCode) {
                return tr('sapReports.noCompanyCodeDefined');
              } else if (!value?.companyCodeText) {
                return `${value.companyCode}: ${tr('sapReports.unknownCompany')}`;
              } else {
                return `${value.companyCode}: ${value.companyCodeText}`;
              }
            },
          },
        }}
      />
    </>
  );
}
