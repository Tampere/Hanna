import { AddCircle } from '@mui/icons-material';
import { Box, Button, css } from '@mui/material';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import Task from './Task';

const tasks = [1, 2, 3, 4];

interface Props {
  projectObjectId: string;
}

export function TaskList({ projectObjectId }: Props) {
  const tr = useTranslations();

  /** Fetch tasks on component mount */
  const projectObjectTasks = trpc.task.getByProjectObjectId.useQuery({ projectObjectId });

  console.log(projectObjectTasks.data);

  return (
    <Box>
      <Box
        css={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <Button variant="contained" color="primary" size="small" endIcon={<AddCircle />}>
          {tr('task.createTask')}
        </Button>
      </Box>
      <Box>
        {tasks.map((_task) => (
          <Task />
        ))}
      </Box>
    </Box>
  );
}
