import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  css,
} from '@mui/material';
import dayjs from 'dayjs';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@frontend/client';
import { FormField } from '@frontend/components/forms';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { ProjectTypePath } from '@frontend/types';

interface Props {
  handleClose: () => void;
  projectId: string;
  projectType?: ProjectTypePath;
}

const MIN_SHIFT_YEAR = 2000;
const MAX_SHIFT_YEAR = dayjs().year() + 100;

export function ProjectShiftView(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();

  const projectShiftMutation = trpc.project.shiftProjectDateWithYears.useMutation({
    onSuccess: () => {
      notify({
        severity: 'success',
        title: tr('projectView.projectShiftSuccessful'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('projectView.projectShiftFailed'),
        duration: 5000,
      });
    },
  });

  const form = useForm({
    mode: 'onChange',
    defaultValues: { newStartYear: dayjs().year() },
    resolver: zodResolver(
      z.object({
        newStartYear: z.number().min(MIN_SHIFT_YEAR).max(MAX_SHIFT_YEAR),
      }),
    ),
  });

  const { isValid } = form.formState;

  async function onSubmit() {
    await projectShiftMutation.mutateAsync({
      newStartYear: form.getValues('newStartYear'),
      projectId: props.projectId,
    });
    props.handleClose();
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
      <DialogTitle>{tr('projectView.projectShiftDialogLabel')}</DialogTitle>
      <DialogContent
        css={css`
          padding-bottom: 0;
        `}
      >
        <DialogContentText>
          {props.projectType === 'asemakaavahanke'
            ? tr('projectView.projectShiftDialogTextDetailplan')
            : tr('projectView.projectShiftDialogText')}
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
            <FormField
              css={css`
                margin-right: auto;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 1rem;
              `}
              formField="newStartYear"
              label={tr('projectView.projectShiftFormLabel')}
              errorTooltip={tr(
                'projectView.projectShiftFormErrorTooltip',
                MIN_SHIFT_YEAR,
                MAX_SHIFT_YEAR,
              )}
              component={(field) => (
                <TextField
                  {...field}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (isNaN(value)) {
                      return;
                    }
                    field.onChange(Number(e.target.value));
                  }}
                  size="small"
                  autoFocus={true}
                />
              )}
            />
            <Box
              css={css`
                margin-left: auto;
              `}
            >
              <Button onClick={props.handleClose} color="primary">
                {tr('cancel')}
              </Button>
              <Button disabled={!isValid} type="submit" color="primary" variant="contained">
                {tr('ok')}
              </Button>
            </Box>
          </form>
        </FormProvider>
      </DialogActions>
    </Dialog>
  );
}
