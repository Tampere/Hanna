import {
  Box,
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
}

const stickyColumnStyle = css`
  position: sticky;
  left: 0;
  background: #fff;
`;

export function TaskList({ projectObjectId }: Props) {
  const tr = useTranslations();

  /** Fetch tasks on component mount */
  const projectObjectTasks = trpc.task.getByProjectObjectId.useQuery(
    { projectObjectId },
    {
      enabled: Boolean(projectObjectId),
      queryKey: ['task.getByProjectObjectId', { projectObjectId }],
    }
  );

  return (
    <Box>
      {projectObjectTasks.data?.length === 0 ? (
        <span>{tr('projectObject.noTasks')}</span>
      ) : (
        <TableContainer>
          <Table
            size="small"
            css={css`
              white-space: nowrap;
            `}
          >
            <TableHead>
              <TableRow>
                <TableCell css={stickyColumnStyle}>
                  <Typography variant="overline">{tr('taskForm.taskNameLabel')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="overline">{tr('taskForm.lifecycleStateLabel')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="overline">{tr('taskForm.taskTypeLabel')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="overline">{tr('taskForm.startDateLabel')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="overline">{tr('taskForm.endDateLabel')}</Typography>
                </TableCell>
                {/* TODO aggregate columns for financial data */}
              </TableRow>
            </TableHead>
            <TableBody>
              {projectObjectTasks.data?.map((task) => (
                <TaskRow key={task.id} task={task} projectObjectId={projectObjectId} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
