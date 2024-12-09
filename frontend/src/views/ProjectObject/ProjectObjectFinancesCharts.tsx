import { Box, Skeleton, css } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { theme } from '@frontend/Layout';
import { trpc } from '@frontend/client';
import { AmountChartHeader } from '@frontend/components/Charts/AmountChartHeader';
import { ContractPriceChartHeader } from '@frontend/components/Charts/ContractPriceChartHeader';
import { FinancesBarChart } from '@frontend/components/Charts/FinancesBarChart';
import { getYAxisScale } from '@frontend/components/Charts/utils';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { TranslationKey } from '@shared/language';

const DATA_LABEL_COUNT = 12;

interface Props {
  projectObjectId: string;
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

export function ProjectObjectFinancesCharts(props: Props) {
  const tr = useTranslations();

  const monthlyActuals = trpc.sap.getMonthlyActualsByProjectObjectId.useQuery({
    projectObjectId: props.projectObjectId,
    startYear: props.startYear,
    endYear: props.endYear,
  });

  const budget = trpc.projectObject.getBudget.useQuery(
    { projectObjectId: props.projectObjectId },
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
    return {
      max: Math.max(...values.flatMap((yearActuals) => yearActuals.map((actual) => actual.total))),
      min: Math.min(...values.flatMap((yearActuals) => yearActuals.map((actual) => actual.total))),
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
        const contractPrice = budget.data?.find((b) => b.year === Number(year))?.budgetItems
          .contractPrice;

        if (!monthlyActuals.data?.[year]) {
          return (
            <Box
              key={year}
              css={css`
                border-top: 1px solid ${theme.palette.divider};
                padding: 1rem 0;
              `}
            >
              <AmountChartHeader year={year} amount={amount} totalsError={monthlyActuals.isError} />
              <ContractPriceChartHeader contractPrice={contractPrice} />
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
            <AmountChartHeader
              year={year}
              totalInCurrencySubunit={totalInCurrencySubunit}
              amount={amount}
            />

            <ContractPriceChartHeader
              contractPrice={contractPrice}
              totalInCurrencySubunit={totalInCurrencySubunit}
            />
            <FinancesBarChart
              referenceLineValue={amount ? amount / 100 / DATA_LABEL_COUNT : null}
              barData={data}
              dataLabels={getRange(1, DATA_LABEL_COUNT).map((i) => tr(labels[i - 1]))}
              colors={[chartColors[idx % 2 == 0 ? 0 : 1]]}
              yAxisScale={getYAxisScale(
                extremeAmountValues
                  ? {
                      max:
                        (amount
                          ? Math.max(extremeAmountValues.max, amount / DATA_LABEL_COUNT)
                          : extremeAmountValues.max) / 100,
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
