import { Alert, Box, Typography, css } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

import { formatCurrency } from '../forms/CurrencyInput';
import { ProgressBar } from './ProgressBar';

interface ChartHeaderProps {
  year: number;
  totalInCurrencySubunit?: number;
  totalsError?: boolean;
  amount?: number | null;
}

export function ChartHeader({
  year,
  totalInCurrencySubunit,
  totalsError,
  amount,
}: ChartHeaderProps) {
  const tr = useTranslations();

  return (
    <Box
      css={css`
        display: flex;
        gap: 2.5rem;
        align-items: center;
      `}
    >
      <Typography
        css={(theme) => css`
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
          display: grid;
          flex: 1;
          max-width: 380px;
          @media screen and (min-width: 1200px) {
            max-width: 600px;
            gap: 0.5rem;
          }
          grid: auto / minmax(180px, 240px) minmax(180px, 240px);
          gap: 1.5rem;
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
          <Typography>
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
      {amount && (
        <ProgressBar
          fillPrecentage={
            amount > 0 && totalInCurrencySubunit && totalInCurrencySubunit > 0
              ? (totalInCurrencySubunit / amount) * 100
              : 0
          }
        />
      )}
    </Box>
  );
}
