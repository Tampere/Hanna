import { Delete } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
  message: string;
  disabled: boolean;
}

export function DeleteProjectDialog({ projectId, message, disabled }: Readonly<Props>) {
  const navigate = useNavigate();
  const notify = useNotifications();
  const tr = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectDeleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      navigate(`/kartta/hankkeet`);
      notify({
        severity: 'success',
        title: tr('projectDelete.notifyDelete'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('projectDelete.notifyDeleteFailed'),
      });
    },
  });

  const onDelete = async (projectId: string) => projectDeleteMutation.mutate({ projectId });

  function handleSubmit() {
    setIsDialogOpen(false);
    onDelete(projectId);
  }

  return (
    <>
      <Button
        size="small"
        variant="contained"
        sx={{ mt: 2 }}
        disabled={disabled}
        endIcon={<Delete />}
        onClick={() => setIsDialogOpen(true)}
      >
        {tr('projectDelete.delete')}
      </Button>
      <Dialog open={isDialogOpen}>
        <DialogTitle>{tr('deleteProjectDialog.title')}</DialogTitle>
        <DialogContent>{message}</DialogContent>
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
