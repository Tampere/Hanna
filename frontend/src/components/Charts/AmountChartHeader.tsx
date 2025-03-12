import { Alert, Box, Typography, css } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

import { formatCurrency } from '../forms/CurrencyInput';
import { ProgressBar } from './ProgressBar';

interface AmountChartHeaderProps {
  year: number;
  totalInCurrencySubunit?: number;
  totalsError?: boolean;
  amount?: number | null;
}

export function AmountChartHeader({
  year,
  totalInCurrencySubunit,
  totalsError,
  amount,
}: AmountChartHeaderProps) {
  const tr = useTranslations();
  console.log(amount);
  return (
    <Box
      css={css`
        display: flex;
        align-items: center;
        margin-right: 25px;
        padding: 5px;
      `}
    >
      <Box
        css={css`
          flex: 1;
          display: grid;
          align-items: center;
          gap: 30px;
          grid: auto / 50px 425px auto;
        `}
      >
        <Typography
          css={(theme) => css`
            grid-column: 1;
            align-self: stretch;
            font-size: 16px;
            font-weight: 700;
            color: ${theme.palette.primary.main};
          `}
        >
          {year}
        </Typography>
        <Box
          css={css`
            grid-column: 2;
            display: flex;
            gap: 20px;
            justify-content: space-between;
          `}
        >
          {totalInCurrencySubunit ? (
            <Typography
              css={css`
                color: ${totalInCurrencySubunit && amount && amount < totalInCurrencySubunit
                  ? '#e46c29'
                  : 'none'};
              `}
            >
              <span
                css={css`
                  color: #525252;
                  padding-right: 0.25rem;
                `}
              >
                {tr('financesChart.totalLabel')}:
              </span>{' '}
              {formatCurrency(totalInCurrencySubunit)}
            </Typography>
          ) : totalsError ? (
            <Alert severity="error">{tr('financesChart.totalsErrorLabel')}</Alert>
          ) : (
            <Typography
              css={css`
                color: #888888;
                font-style: italic;
              `}
            >
              {tr('financesChart.noTotalLabel')}
            </Typography>
          )}
          {amount ? (
            <Typography
              css={css`
                text-align: right;
              `}
            >
              <span
                css={css`
                  color: #525252;
                  padding-right: 0.25rem;
                `}
              >
                {tr('financesChart.amountLabel')}:
              </span>{' '}
              {amount && formatCurrency(amount)}
            </Typography>
          ) : (
            <Typography
              css={css`
                color: #888888;
                font-style: italic;
              `}
            >
              {tr('financesChart.noAmountLabel')}
            </Typography>
          )}
        </Box>
        {typeof amount === 'number' && amount > 0 && (
          <ProgressBar
            cssProp={css`
              grid-column: 3;
            `}
            fillPrecentage={
              amount > 0 && totalInCurrencySubunit && totalInCurrencySubunit > 0
                ? (totalInCurrencySubunit / amount) * 100
                : 0
            }
          />
        )}
      </Box>
    </Box>
  );
}
