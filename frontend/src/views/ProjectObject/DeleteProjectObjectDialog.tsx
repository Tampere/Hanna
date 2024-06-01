import { Delete } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { ProjectTypePath } from '@frontend/types';

interface Props {
  projectId: string;
  projectType: ProjectTypePath;
  projectObjectId: string;
  userCanModify?: boolean;
}

export function DeleteProjectObjectDialog({
  projectId,
  projectType,
  projectObjectId,
  userCanModify,
}: Readonly<Props>) {
  const navigate = useNavigate();
  const notify = useNotifications();
  const tr = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const projectObjectDeleteMutation = trpc.projectObject.delete.useMutation({
    onSuccess: () => {
      navigate(`/${projectType}/${projectId}`);
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

  const onDelete = async (projObjId: string) =>
    projectObjectDeleteMutation.mutate({ projectObjectId: projObjId });

  function handleSubmit() {
    setIsDialogOpen(false);
    onDelete(projectObjectId);
  }

  return (
    <>
      <Button
        size="small"
        variant="contained"
        disabled={!userCanModify}
        sx={{
          mt: 2,
          '&:hover': {
            backgroundColor: 'error.main',
          },
        }}
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
