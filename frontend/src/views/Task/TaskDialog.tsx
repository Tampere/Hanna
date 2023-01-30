import { Button, Dialog, DialogActions, DialogContent, DialogTitle, css } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';

import { useTranslations } from '@frontend/stores/lang';

import { DbTask } from '@shared/schema/task';

import { DeleteTaskDialog } from './DeleteTaskDialog';
import { TaskForm } from './TaskForm';

interface Props {
  projectObjectId: string;
  task: DbTask;
  open: boolean;
  onClose: () => void;
}

const dialogContentStyle = css`
  display: flex;
  flex-direction: column;
`;

const dialogActionsStyle = css`
  display: flex;
  justify-content: space-between;
`;

export function TaskDialog(props: Props) {
  const { projectObjectId, task, open, onClose } = props;
  const queryClient = useQueryClient();
  const tr = useTranslations();

  function invalidateTasks() {
    queryClient.invalidateQueries({
      queryKey: [['task', 'getByProjectObjectId'], { input: { projectObjectId } }],
    });
  }

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { width: 800, maxWidth: '90%' } }}>
      <DialogTitle>{task.taskName}</DialogTitle>
      <DialogContent css={dialogContentStyle}>
        <TaskForm
          projectObjectId={projectObjectId}
          task={task}
          onSubmit={() => {
            invalidateTasks();
          }}
        />
        {/* TODO finance section */}
      </DialogContent>
      <DialogActions css={dialogActionsStyle}>
        <DeleteTaskDialog
          taskId={task.id}
          onDeleted={() => {
            invalidateTasks();
            onClose();
          }}
        />
        <Button onClick={onClose}>{tr('close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
