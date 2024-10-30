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
        gap: 3rem;
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
        <>
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
          <ProgressBar
            fillPrecentage={
              amount > 0 && totalInCurrencySubunit && totalInCurrencySubunit > 0
                ? (totalInCurrencySubunit / amount) * 100
                : 0
            }
          />
        </>
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
  );
}
