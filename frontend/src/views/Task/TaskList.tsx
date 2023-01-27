import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
                <TableCell css={stickyColumnStyle}>{tr('taskForm.taskNameLabel')}</TableCell>
                <TableCell>{tr('taskForm.lifecycleStateLabel')}</TableCell>
                <TableCell>{tr('taskForm.taskTypeLabel')}</TableCell>
                <TableCell>{tr('taskForm.startDateLabel')}</TableCell>
                <TableCell>{tr('taskForm.endDateLabel')}</TableCell>
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
