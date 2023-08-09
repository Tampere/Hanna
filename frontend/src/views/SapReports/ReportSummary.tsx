import { Box, Skeleton, Typography, css } from '@mui/material';

import { formatCurrency } from '../../components/forms/CurrencyInput';
import { useTranslations } from '../../stores/lang';

interface Props {
  loading: boolean;
  summary:
    | {
        totalDebitSum: number;
        totalCreditSum: number;
        totalActualsSum: number;
      }
    | undefined;
}

function ValueIndicator({
  loading,
  label,
  value,
}: {
  loading: boolean;
  label: string;
  value: number | undefined;
}) {
  return (
    <Box
      css={css`
        display: flex;
        flex-direction: row;
        gap: 10px;
      `}
    >
      <Typography
        css={css`
          font-weight: 600;
        `}
        color="primary"
      >
        {label}:
      </Typography>
      {loading ? (
        <Skeleton variant="text" height={24} width={100} />
      ) : (
        <Typography>{formatCurrency(value ?? 0)}</Typography>
      )}
    </Box>
  );
}

export function ReportSummary({ summary, loading }: Props) {
  const tr = useTranslations();
  return (
    <Box
      css={css`
        display: flex;
        justify-content: flex-start;
        gap: 40px;
        flex-wrap: wrap;
      `}
    >
      <ValueIndicator
        loading={loading}
        label={tr('sapReports.totalDebitSum')}
        value={summary?.totalDebitSum}
      />
      <ValueIndicator
        loading={loading}
        label={tr('sapReports.totalCreditSum')}
        value={summary?.totalCreditSum}
      />
      <ValueIndicator
        loading={loading}
        label={tr('sapReports.totalActualsSum')}
        value={summary?.totalActualsSum}
      />
    </Box>
  );
}
