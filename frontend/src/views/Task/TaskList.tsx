import {
  Alert,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  css,
} from '@mui/material';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { TaskRow } from './TaskRow';

interface Props {
  projectObjectId: string;
  isOwner?: boolean;
  canWrite?: boolean;
  caneEditFinances?: boolean;
}

export function TaskList({ projectObjectId }: Props) {
  const tr = useTranslations();

  const activities = trpc.sap.getWbsActualsByNetworkActivity.useQuery({
    projectObjectId,
  });

  return (
    <Box>
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
            {activities.data ? (
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
                  ) : activities.isError ? (
                    <Alert
                      css={css`
                        display: flex;
                        justify-content: center;
                      `}
                      severity="error"
                    >
                      {tr('task.error')}
                    </Alert>
                  ) : (
                    <Typography>{tr('projectObject.noTasks')}</Typography>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
