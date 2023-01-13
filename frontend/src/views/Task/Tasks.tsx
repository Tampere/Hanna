import { Box } from '@mui/system';

import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';

interface Props {
  projectObjectId: string;
}

export default function Tasks({ projectObjectId }: Props) {
  return (
    <Box>
      <TaskForm projectObjectId={projectObjectId} />
      <TaskList projectObjectId={projectObjectId} />
    </Box>
  );
}
