import { css } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { TableCell, TableRow, Typography } from '@mui/material';

import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { SapTask } from '@shared/schema/task';

interface Props {
  projectObjectId: string;
  task: SapTask;
  onToggleSelection: (id: string) => void;
  isSelected: boolean;
}

export function TaskRow(props: Readonly<Props>) {
  const tr = useTranslations();

  function getActivityDescription() {
    if (!props.task.activityId && !props.task.description) {
      return tr('task.noActivityDescription');
    }
    return `${props.task.activityId ?? ''} ${props.task.description ?? ''}`; // numsp as space
  }

  return (
    <>
      <TableRow>
        <TableCell
          css={css`
            padding: 0.8em;
            font-weight: 600;
          `}
        >
          {getActivityDescription()}
        </TableCell>
        <TableCell
          css={(theme) => css`
            color: ${props.isSelected ? theme.palette.primary.main : '#000'};
          `}
          align="right"
        >
          <Typography
            css={css`
              font-weight: ${props.isSelected ? 600 : 400};
            `}
          >
            {formatCurrency(props.task.total)}
          </Typography>
        </TableCell>
        <TableCell align="left">
          {props.isSelected ? (
            <RemoveIcon
              css={(theme) => css`
                &:hover {
                  color: ${theme.palette.error.main};
                }
                display: block;
                color: ${theme.palette.primary.main};
                transition: color 0.3s ease-in-out;
              `}
              onClick={() => props.onToggleSelection(props.task.activityId)}
            />
          ) : (
            <AddIcon
              css={(theme) => css`
                &:hover {
                  color: ${theme.palette.success.main};
                }
                display: block;
                color: ${theme.palette.primary.main};
                transition: color 0.3s ease-in-out;
              `}
              onClick={() => props.onToggleSelection(props.task.activityId)}
            />
          )}
        </TableCell>
      </TableRow>
    </>
  );
}
