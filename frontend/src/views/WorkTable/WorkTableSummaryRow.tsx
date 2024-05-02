import { Box, Typography, css } from '@mui/material';
import { UseTRPCQueryResult } from '@trpc/react-query/dist/shared';
import { forwardRef } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { WorkTableRow } from '@shared/schema/workTable';

import { CellEditEvent } from './WorkTable';

interface Props {
  workTableData: UseTRPCQueryResult<Readonly<WorkTableRow[]>, object>;
  editEvents: CellEditEvent[];
}

export const WorkTableSummaryRow = forwardRef(function WorkTableSummaryRow(
  { workTableData, editEvents }: Props,
  ref,
) {
  const tr = useTranslations();

  function calculateRowSum(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / 100;
  }

  function getSummaryData(
    fieldName: 'budget' | 'actual' | 'forecast' | 'kayttosuunnitelmanMuutos',
  ) {
    const eurFormat = new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
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
        margin: 0 -1rem;
        padding: 1rem;
        gap: 1.5rem;
        position: sticky;
        top: -1rem;
        z-index: 100;
        outline: solid white;
        background-color: white;
        min-height: 54px;
        p {
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .summaryContainer {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .summaryLabel {
          font-weight: 600;
          white-space: nowrap;
          color: ${theme.palette.primary.main};
        }
      `}
    >
      <Box className="summaryContainer">
        <Typography className="summaryLabel">{tr('workTable.summary.budget')}:</Typography>
        <Typography>{getSummaryData('budget')}</Typography>
      </Box>
      <Box className="summaryContainer">
        <Typography className="summaryLabel">{tr('workTable.summary.actual')}:</Typography>
        <Typography>{getSummaryData('actual')}</Typography>
      </Box>
      <Box className="summaryContainer">
        <Typography className="summaryLabel">{tr('workTable.summary.forecast')}:</Typography>
        <Typography>{getSummaryData('forecast')}</Typography>
      </Box>
      <Box className="summaryContainer">
        <Typography className="summaryLabel" style={{ whiteSpace: 'normal' }}>
          {tr('workTable.summary.kayttosuunnitelmanMuutos')}:
        </Typography>
        <Typography>{getSummaryData('kayttosuunnitelmanMuutos')}</Typography>
      </Box>
    </Box>
  );
});
