import { Box, Typography, css } from '@mui/material';
import { UseTRPCQueryResult } from '@trpc/react-query/dist/shared';
import { forwardRef } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { WorkTableRow } from '@shared/schema/workTable';

import { CellEditEvent } from './worktables/WorkTable';

interface Props {
  workTableData: UseTRPCQueryResult<Readonly<WorkTableRow[]>, object>;
  editEvents: CellEditEvent[];
  selectedYear: number | 'allYears';
  lockedYears: number[];
}

function calculateRowSum(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / 100;
}

export const WorkTableSummaryRow = forwardRef(function WorkTableSummaryRow(
  { workTableData, editEvents, selectedYear, lockedYears }: Props,
  ref,
) {
  const isFutureYear = selectedYear !== 'allYears' && selectedYear > new Date().getFullYear();
  const isLockedYear = selectedYear !== 'allYears' && lockedYears.includes(selectedYear);
  const tr = useTranslations();

  function getSummaryStyle(
    fieldName: 'amount' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos' | 'estimate',
  ) {
    if (
      (isFutureYear &&
        (fieldName === 'forecast' ||
          fieldName === 'kayttosuunnitelmanMuutos' ||
          fieldName === 'actual')) ||
      (isLockedYear && fieldName === 'estimate')
    ) {
      return `disabled`;
    }
    return '';
  }

  function getSummaryData(
    fieldName: 'amount' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos' | 'estimate',
  ) {
    // Return a dash for future years for listed fields
    // and for locked years for the estimate field
    if (
      (isFutureYear &&
        (fieldName === 'forecast' ||
          fieldName === 'kayttosuunnitelmanMuutos' ||
          fieldName === 'actual')) ||
      (isLockedYear && fieldName === 'estimate')
    ) {
      return '–';
    }
    const eurFormat = new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });

    if (!workTableData?.data) {
      return eurFormat.format(0);
    }
    const sum = calculateRowSum(
      workTableData.data
        .map((data: WorkTableRow) =>
          Number(
            editEvents.find((event) => event.rowId === data.id && event.field === fieldName)
              ?.newValue ?? data[fieldName],
          ),
        )
        .filter((data) => !isNaN(data)),
    );

    return eurFormat.format(sum);
  }

  return (
    <Box
      ref={ref}
      css={(theme) => css`
        display: flex;
        flex-wrap: wrap;
        padding: 0.5rem;
        gap: 1.5rem;
        z-index: 100;
        background-color: white;
        min-height: 54px;
        p {
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .summaryContainer {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .summaryLabel {
          font-weight: 600;
          white-space: nowrap;
          color: ${theme.palette.primary.main};
        }
        .disabled {
          color: ${theme.palette.text.disabled};
        }
      `}
    >
      <Box className="summaryContainer">
        <Typography className={`summaryLabel ${getSummaryStyle('estimate')}`}>
          {tr('workTable.summary.estimate')}:
        </Typography>
        <Typography className={getSummaryStyle('estimate')}>
          {getSummaryData('estimate')}
        </Typography>
      </Box>

      <Box className="summaryContainer">
        <Typography className="summaryLabel">{tr('workTable.summary.amount')}:</Typography>
        <Typography>{getSummaryData('amount')}</Typography>
      </Box>

      <Box className="summaryContainer">
        <Typography className={`summaryLabel ${getSummaryStyle('actual')}`}>
          {tr('workTable.summary.actual')}:
        </Typography>
        <Typography className={getSummaryStyle('actual')}>{getSummaryData('actual')}</Typography>
      </Box>

      <Box className="summaryContainer">
        <Typography className={`summaryLabel ${getSummaryStyle('forecast')}`}>
          {tr('workTable.summary.forecast')}:
        </Typography>
        <Typography className={getSummaryStyle('forecast')}>
          {getSummaryData('forecast')}
        </Typography>
      </Box>

      <Box className="summaryContainer">
        <Typography
          className={`summaryLabel ${getSummaryStyle('kayttosuunnitelmanMuutos')}`}
          style={{ whiteSpace: 'normal' }}
        >
          {tr('workTable.summary.kayttosuunnitelmanMuutos')}:
        </Typography>
        <Typography className={getSummaryStyle('kayttosuunnitelmanMuutos')}>
          {getSummaryData('kayttosuunnitelmanMuutos')}
        </Typography>
      </Box>
    </Box>
  );
});
