import { Delete } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
  projectObjectId: string;
}

export function DeleteProjectObjectDialog({ projectId, projectObjectId }: Props) {
  const navigate = useNavigate();
  const notify = useNotifications();
  const tr = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectObjectDeleteMutation = trpc.projectObject.delete.useMutation({
    onSuccess: () => {
      navigate(`/hanke/${projectId}`);
      notify({
        severity: 'success',
        title: tr('projectObjectDelete.notifyDelete'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('projectObjectDelete.notifyDeleteFailed'),
      });
    },
  });

  const onDelete = async (id: string) => projectObjectDeleteMutation.mutate({ id });

  function handleSubmit() {
    setIsDialogOpen(false);
    onDelete(projectObjectId);
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
        {tr('projectObjectDelete.delete')}
      </Button>
      <Dialog open={isDialogOpen}>
        <DialogTitle>{tr('deleteProjectObjectDialog.title')}</DialogTitle>
        <DialogContent>{tr('deleteProjectObjectDialog.content')}</DialogContent>
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
