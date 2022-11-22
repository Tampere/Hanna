import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
}

export function DeleteProjectDialog({ projectId }: Props) {
  const navigate = useNavigate();
  const notify = useNotifications();
  const tr = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectDeleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => {
      navigate(`/hankkeet`);
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

  const onDelete = async (id: string) => projectDeleteMutation.mutate({ id });

  function handleSubmit() {
    setIsDialogOpen(false);
    onDelete(projectId);
  }

  return (
    <>
      <Button sx={{ mt: '1rem' }} variant="contained" onClick={() => setIsDialogOpen(true)}>
        {tr('projectDelete.delete')}
      </Button>
      <Dialog open={isDialogOpen}>
        <DialogTitle>{tr('deleteProjectDialog.title')}</DialogTitle>
        <DialogContent>{tr('deleteProjectDialog.content')}</DialogContent>
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
