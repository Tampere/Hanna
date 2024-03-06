import { AddCircle, Undo } from '@mui/icons-material';
import { Button } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';

interface Props {
  projectObjectId: string;
  isOwner?: boolean;
  canWrite?: boolean;
}

export default function Tasks({
  projectObjectId,
  isOwner = false,
  canWrite = false,
}: Readonly<Props>) {
  const [displayTaskForm, setDisplayTaskForm] = useState(false);
  const tr = useTranslations();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          disabled={!(isOwner || canWrite)}
          color="primary"
          size="small"
          endIcon={displayTaskForm ? <Undo /> : <AddCircle />}
          onClick={() => setDisplayTaskForm((prev) => !prev)}
        >
          {displayTaskForm ? tr('task.cancel') : tr('task.createTask')}
        </Button>
      </Box>
      {displayTaskForm ? (
        <TaskForm
          projectObjectId={projectObjectId}
          userCanModify={isOwner || canWrite}
          onSubmit={() => setDisplayTaskForm(false)}
        />
      ) : (
        <TaskList projectObjectId={projectObjectId} isOwner={isOwner} canWrite={canWrite} />
      )}
    </Box>
  );
}
