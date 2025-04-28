import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
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

import { theme } from '@frontend/Layout';
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
const greyedText = '#939dae';

export function TaskList({ projectObjectId }: Props) {
  const [infoBoxOpen, setInfoBoxOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  const tr = useTranslations();

  const activities = trpc.sap.getWbsActualsByNetworkActivity.useQuery({
    projectObjectId,
  });

  if (activities.data && activities.data.length === 0) {
    return <Typography>{tr('projectObject.noTasks')}</Typography>;
  }

  const toggleSelection = (activityId: string) => {
    const newSelection = new Set(selectedActivities);
    if (newSelection.has(activityId)) {
      newSelection.delete(activityId);
    } else {
      newSelection.add(activityId);
    }

    setSelectedActivities(newSelection);
  };

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
            <TableRow
              color="primary"
              css={(theme) => css`
                background-color: ${theme.palette.primary.main};
              `}
            >
              <TableCell
                css={css`
                  width: 50%;
                `}
              >
                <Typography
                  css={css`
                    color: ${theme.palette.primary.contrastText};
                  `}
                >
                  {tr('task.taskTypeLabel')}
                </Typography>
              </TableCell>
              <TableCell
                align="right"
                css={css`
                  min-width: 150px;
                `}
              >
                <Typography
                  css={css`
                    color: ${theme.palette.primary.contrastText};
                  `}
                >
                  {tr('task.actuals')}
                </Typography>
              </TableCell>
              <TableCell>
                {selectedActivities.size === activities.data?.length ? (
                  <RemoveIcon
                    css={(theme) => css`
                      &:hover {
                        color: ${theme.palette.error.main};
                      }
                      line-height: 1;
                      color: ${greyedText};
                      transition: color 0.3s ease-in-out;
                    `}
                    onClick={() => setSelectedActivities(new Set())}
                  />
                ) : (
                  <AddIcon
                    css={(theme) => css`
                      &:hover {
                        color: ${theme.palette.success.main};
                      }
                      color: #939dae;
                      transition: color 0.3s ease-in-out;
                    `}
                    onClick={() => {
                      const newSet: Set<string> = new Set();
                      activities.data?.forEach((d) => {
                        newSet.add(d.activityId);
                      });
                      setSelectedActivities(newSet);
                    }}
                  />
                )}
              </TableCell>
              <TableCell
                css={(theme) => css`
                  color: ${theme.palette.primary.contrastText};
                `}
              >
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
                  onToggleSelection={() => toggleSelection(activity.activityId)}
                  isSelected={selectedActivities.has(activity.activityId)}
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
              <TableCell
                css={(theme) => css`
                  padding: 0.8em;
                `}
                align="left"
              >
                <Typography
                  css={(theme) => css`
                    font-weight: 600;
                    color: ${theme.palette.primary.main};
                  `}
                  color="primary"
                >
                  {tr('task.sumLine')}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  css={css`
                    font-size: 16;
                  `}
                >
                  {activities.data && activities.data?.length > 0
                    ? formatCurrency(activities.data.reduce((acc, d) => acc + d.total, 0))
                    : 0}
                </Typography>
              </TableCell>
              <TableCell align="left" width="500px">
                {activities.data && selectedActivities.size > 0 ? (
                  <Typography
                    css={css`
                      font-weight: 600;
                      font-size: 16;
                    `}
                  >
                    {formatCurrency(
                      activities.data
                        .filter((d) => selectedActivities.has(d.activityId))
                        .reduce((acc, d) => acc + d.total, 0),
                    )}
                  </Typography>
                ) : (
                  <Typography color={`${greyedText}`}>{tr('task.noSelection')}</Typography>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
