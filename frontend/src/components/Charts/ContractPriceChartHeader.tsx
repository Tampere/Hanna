import { Box, Typography, css } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

import { formatCurrency } from '../forms/CurrencyInput';
import { ProgressBar } from './ProgressBar';

interface ContractPriceChartHeaderProps {
  totalInCurrencySubunit?: number;
  contractPrice?: number | null;
}

export function ContractPriceChartHeader({
  totalInCurrencySubunit,
  contractPrice,
}: ContractPriceChartHeaderProps) {
  const tr = useTranslations();

  return (
    <Box
      css={css`
        display: flex;
        margin-right: 25px;
        padding: 5px;
      `}
    >
      <Box
        css={css`
          flex: 1;
          display: grid;
          gap: 30px;
          grid: auto / 235px 240px auto;
          align-items: center;
        `}
      >
        {contractPrice ? (
          <Typography
            css={css`
              grid-column: 2;
              text-align: right;
            `}
          >
            <span
              css={css`
                color: #525252;
                padding-right: 0.25rem;
              `}
            >
              {tr('financesChart.contractPriceLabel')}:
            </span>{' '}
            {contractPrice && formatCurrency(contractPrice)}
          </Typography>
        ) : (
          <Typography
            css={css`
              grid-column: 2;
              text-align: right;
              color: #888888;
              font-style: italic;
            `}
          >
            {tr('financesChart.noContractPriceLabel')}
          </Typography>
        )}

        {contractPrice && (
          <ProgressBar
            cssProp={css`
              grid-column: 3;
            `}
            fillPrecentage={
              contractPrice > 0 && totalInCurrencySubunit && totalInCurrencySubunit > 0
                ? (totalInCurrencySubunit / contractPrice) * 100
                : 0
            }
          />
        )}
      </Box>
    </Box>
  );
}
