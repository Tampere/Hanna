import { Close, InfoOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  css,
  tooltipClasses,
} from '@mui/material';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { HelpTooltip } from '@frontend/components/HelpTooltip';
import { formatCurrency } from '@frontend/components/forms/CurrencyInput';
import { useTranslations } from '@frontend/stores/lang';

import { TaskRow } from './TaskRow';

interface Props {
  projectObjectId: string;
  isOwner?: boolean;
  canWrite?: boolean;
  caneEditFinances?: boolean;
}

export function TaskList({ projectObjectId }: Props) {
  const [infoBoxOpen, setInfoBoxOpen] = useState(false);
  const tr = useTranslations();

  const activities = trpc.sap.getWbsActualsByNetworkActivity.useQuery({
    projectObjectId,
  });

  if (activities.data && activities.data.length === 0) {
    return <Typography>{tr('projectObject.noTasks')}</Typography>;
  }

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: row;
      `}
    >
      <TableContainer>
        <Table
          size="small"
          css={css`
            white-space: nowrap;
          `}
        >
          <TableHead>
            <TableRow>
              <TableCell
                css={css`
                  width: 50%;
                `}
              >
                <Typography variant="overline">{tr('task.taskTypeLabel')}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="overline">{tr('task.actuals')}</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activities.data && activities.data?.length > 0 ? (
              activities.data.map((activity) => (
                <TaskRow
                  key={activity.activityId}
                  task={activity}
                  projectObjectId={projectObjectId}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  css={css`
                    border-bottom: none;
                    text-align: center;
                    padding: 8px;
                  `}
                >
                  {activities.isLoading ? (
                    <CircularProgress />
                  ) : (
                    activities.isError && (
                      <Alert
                        css={css`
                          display: flex;
                          justify-content: center;
                        `}
                        severity="error"
                      >
                        {tr('task.error')}
                      </Alert>
                    )
                  )}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell>Yhteensä</TableCell>
              <TableCell>
                {activities.data && activities.data?.length > 0
                  ? formatCurrency(activities.data.reduce((acc, d) => acc + d.total, 0))
                  : 0}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <HelpTooltip
        componentProps={{
          tooltip: { style: { backgroundColor: 'transparent', minWidth: '500px' } },
        }}
        cssProp={css`
          margin-bottom: auto;
        `}
        title={<Alert severity="info"> {tr('task.additionalInfo')}</Alert>}
        placement="left"
      />
    </Box>
  );
}
