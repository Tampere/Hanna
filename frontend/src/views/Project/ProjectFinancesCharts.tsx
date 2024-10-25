import { Box, Skeleton, css } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { theme } from '@frontend/Layout';
import { trpc } from '@frontend/client';
import { ChartHeader } from '@frontend/components/Charts/ChartHeader';
import { FinancesBarChart } from '@frontend/components/Charts/FinancesBarChart';
import { getYAxisScale } from '@frontend/components/Charts/utils';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { TranslationKey } from '@shared/language';

interface Props {
  projectId: string;
  endYear: number;
  startYear: number;
}

const labels: TranslationKey[] = [
  'january.short',
  'february.short',
  'march.short',
  'april.short',
  'may.short',
  'june.short',
  'july.short',
  'august.short',
  'september.short',
  'october.short',
  'november.short',
  'december.short',
];

const chartColors = ['#105DA4', theme.palette.primary.main];

export function ProjectFinancesCharts(props: Props) {
  const tr = useTranslations();

  const monthlyActuals = trpc.sap.getMonthlyActualsByProjectId.useQuery({
    projectId: props.projectId,
    startYear: props.startYear,
    endYear: props.endYear,
  });
  const budget = trpc.project.getBudget.useQuery(
    { projectId: props.projectId },
    { enabled: Boolean(monthlyActuals.data) },
  );

  const dataYears =
    monthlyActuals.data && Object.keys(monthlyActuals.data).map((year) => Number(year));
  const displayedEndYear = Math.max(
    Math.min(dayjs().year(), props.endYear),
    Math.max(...(dataYears ?? [])),
  );

  const extremeAmountValues = useMemo(() => {
    if (!monthlyActuals.data) {
      return null;
    }
    const values = Object.values(monthlyActuals.data);
    const actuals = values.flatMap((yearActuals) => yearActuals.map((actual) => actual.total));
    return {
      max: Math.max(...actuals),
      min: Math.min(...actuals),
    };
  }, [monthlyActuals.data]);

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
      `}
    >
      {getRange(props.startYear, displayedEndYear, true).map((year, idx) => {
        if (monthlyActuals.isLoading) {
          return (
            <Skeleton
              css={css`
                margin: 0.25rem;
              `}
              variant="rectangular"
              height={50}
              key={year}
            />
          );
        }
        const amount = budget.data?.find((b) => b.year === Number(year))?.budgetItems.amount;
        if (!monthlyActuals.data?.[year]) {
          return (
            <Box
              key={year}
              css={css`
                border-top: 1px solid ${theme.palette.divider};
                padding: 1rem 0;
              `}
            >
              <ChartHeader year={year} amount={amount} totalsError={monthlyActuals.isError} />
            </Box>
          );
        }
        const data = monthlyActuals.data?.[year].map((actual) => actual.total / 100) ?? [];
        const totalInCurrencySubunit = data.reduce((sum, val) => sum + val, 0) * 100;

        return (
          <Box
            css={css`
              padding-top: 1rem;
              border-top: 1px solid ${theme.palette.divider};
            `}
            key={year}
          >
            <ChartHeader
              year={year}
              totalInCurrencySubunit={totalInCurrencySubunit}
              amount={amount}
            />
            <FinancesBarChart
              totalAmount={amount ? amount / 100 : null}
              barData={data}
              dataLabels={getRange(1, 12).map((i) => tr(labels[i - 1]))}
              colors={[chartColors[idx % 2 == 0 ? 0 : 1]]}
              yAxisScale={getYAxisScale(
                extremeAmountValues
                  ? {
                      max: extremeAmountValues.max / 100,
                      min: data.some((d) => d < 0) ? extremeAmountValues.min / 100 : 0,
                    }
                  : { max: 0, min: 0 },
              )}
            />
          </Box>
        );
      })}
    </Box>
  );
}
