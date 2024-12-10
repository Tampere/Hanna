import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  Typography,
  css,
} from '@mui/material';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { trpc } from '@frontend/client';
import { FormField } from '@frontend/components/forms';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { nonEmptyString } from '@shared/schema/common';

interface Props {
  projectObjectId: string;
  handleClose: () => void;
}

export function ProjectObjectMoveView(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const navigate = useNavigate();

  const newProjectCandidates = trpc.investmentProjectObject.getNewProjectCandidates.useQuery({
    projectObjectId: props.projectObjectId,
  });

  const moveProjectObjectToProjectMutation =
    trpc.investmentProjectObject.moveProjectObjectToProject.useMutation({
      onSuccess: async (data) => {
        props.handleClose();
        navigate(`/investointihanke/${data.projectId}/kohde/${props.projectObjectId}`);
        notify({
          severity: 'success',
          title: tr('projectObjectView.moveToProject.success'),
          duration: 5000,
        });
      },
      onError: () => {
        notify({
          severity: 'error',
          title: tr('projectObjectView.moveToProject.failed'),
          duration: 5000,
        });
      },
    });

  const form = useForm({
    mode: 'onChange',
    defaultValues: { newProjectId: '' },
    resolver: zodResolver(z.object({ newProjectId: nonEmptyString })),
  });

  const { isValid } = form.formState;

  function onSubmit() {
    moveProjectObjectToProjectMutation.mutate({
      projectObjectId: props.projectObjectId,
      newProjectId: form.getValues('newProjectId'),
    });
  }

  return (
    <Dialog
      open
      css={css`
        & .MuiPaper-root {
          width: 450px;
        }
      `}
    >
      <DialogTitle>{tr('projectObjectView.moveToProject')}</DialogTitle>
      <DialogContent
        css={css`
          padding-bottom: 1rem;
        `}
      >
        <DialogContentText>
          {tr('projectObjectView.moveToProject.contentText')}{' '}
          {newProjectCandidates.data &&
            newProjectCandidates.data.length > 0 &&
            tr('projectObjectView.moveToProject.contentTextSap')}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        css={css`
          padding-left: 24px;
        `}
      >
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            autoComplete="off"
            css={css`
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 1rem;
            `}
          >
            {newProjectCandidates.data && newProjectCandidates.data.length > 0 ? (
              <FormField
                css={css`
                  margin-right: auto;
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  gap: 1rem;
                `}
                formField="newProjectId"
                label={tr('projectObjectView.moveToProject.label')}
                errorTooltip={tr('projectObjectView.moveToProject.formError')}
                component={(field) => (
                  <Select
                    autoFocus
                    size="small"
                    css={css`
                      width: 200px;
                    `}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {newProjectCandidates.data?.map((project) => (
                      <MenuItem key={project.projectId} value={project.projectId}>
                        {project.projectName}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            ) : (
              <Typography color="error">
                {tr('projectObjectView.moveToProject.noProjects')}
              </Typography>
            )}
            <Box
              css={css`
                margin-left: auto;
                display: flex;
                gap: 10px;
              `}
            >
              {!newProjectCandidates.isLoading && newProjectCandidates.data?.length === 0 ? (
                <Button onClick={props.handleClose} color="primary" variant="contained">
                  {tr('ok')}
                </Button>
              ) : (
                <>
                  <Button onClick={props.handleClose} color="primary">
                    {tr('cancel')}
                  </Button>
                  <Button disabled={!isValid} type="submit" variant="contained">
                    {tr('projectObjectView.move')}
                  </Button>
                </>
              )}
            </Box>
          </form>
        </FormProvider>
      </DialogActions>
    </Dialog>
  );
}
