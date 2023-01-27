import { Delete } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  taskId: string;
  onDeleted: () => void;
}

export function DeleteTaskDialog({ taskId, onDeleted }: Props) {
  const notify = useNotifications();
  const tr = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const taskDeleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => {
      onDeleted();
      notify({
        severity: 'success',
        title: tr('taskDelete.notifyDelete'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('taskDelete.notifyDeleteFailed'),
      });
    },
  });

  const onDelete = async (id: string) => taskDeleteMutation.mutate({ id });

  function handleSubmit() {
    setIsDialogOpen(false);
    onDelete(taskId);
  }

  return (
    <>
      <Button
        size="small"
        variant="contained"
        sx={{ mt: 2 }}
        endIcon={<Delete />}
        onClick={() => setIsDialogOpen(true)}
      >
        {tr('taskDelete.delete')}
      </Button>
      <Dialog open={isDialogOpen}>
        <DialogTitle>{tr('taskDelete.title')}</DialogTitle>
        <DialogContent>{tr('taskDelete.content')}</DialogContent>
        <DialogActions>
          <Button
            sx={{ mt: '1rem' }}
            variant="contained"
            color="error"
            onClick={() => handleSubmit()}
          >
            {tr('delete')}
          </Button>
          <Button sx={{ mt: '1rem' }} variant="contained" onClick={() => setIsDialogOpen(false)}>
            {tr('cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
