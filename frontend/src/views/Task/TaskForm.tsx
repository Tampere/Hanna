import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, Save, Undo } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
// import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { UpsertTask, upsertTaskSchema } from '@shared/schema/task';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectObjectId: string;
  task?: UpsertTask | null;
}

export function TaskForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  // const queryClient = useQueryClient();
  const {
    formState: { errors },
  } = useForm({
    mode: 'onChange',
  });
  const [editing, setEditing] = useState(!props.task);

  const readonlyProps = useMemo(() => {
    if (editing) {
      return {};
    }
    return {
      hiddenLabel: true,
      variant: 'filled',
      InputProps: { readOnly: true },
    } as const;
  }, [editing]);

  const form = useForm<UpsertTask>({
    mode: 'all',
    resolver: zodResolver(
      upsertTaskSchema.superRefine((val, ctx) => {
        if (val.startDate && val.endDate && dayjs(val.startDate).isAfter(dayjs(val.endDate))) {
          ctx.addIssue({
            path: ['startDate'],
            code: z.ZodIssueCode.custom,
            message: tr('projectObject.error.endDateBeforeStartDate'),
          });
          ctx.addIssue({
            path: ['endDate'],
            code: z.ZodIssueCode.custom,
            message: tr('projectObject.error.endDateBeforeStartDate'),
          });
        }
      })
    ),
    defaultValues: props.task ?? {
      projectObjectId: props.projectObjectId,
      description: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (props.task) {
      form.reset(props.task);
    }
  }, [props.task]);

  useEffect(() => {
    const sub = form.watch((value, { name, type }) => {
      if (type === 'change' && (name === 'startDate' || name === 'endDate')) {
        form.trigger(['startDate', 'endDate']);
      }
    });
    return () => sub.unsubscribe();
  }, [form.watch]);

  const taskUpsert = trpc.task.upsert.useMutation({
    onSuccess: (data) => {
      // queryClient.invalidateQueries({
      //   queryKey: [['project', 'get'], { input: { id: data.id } }],
      // });

      // queryClient.invalidateQueries({
      //   queryKey: [['projectObject', 'get'], { input: { id: data.id } }],
      // });

      setEditing(false);
      form.reset(data);

      notify({
        severity: 'success',
        title: tr('taskForm.notifyUpsertSuccess'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('taskForm.notifyUpsertFailure'),
      });
    },
  });

  const onSubmit = (data: UpsertTask) => {
    taskUpsert.mutate(data);
  };

  return (
    <FormProvider {...form}>
      {!props.task && <Typography variant="overline">{tr('newProjectObject.title')}</Typography>}
      {props.task && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="overline">{tr('projectObject.formTitle')}</Typography>
          {!form.formState.isDirty && !editing ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => setEditing(!editing)}
              endIcon={<Edit />}
            >
              {tr('projectForm.editBtnLabel')}
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => {
                form.reset();
                setEditing(!editing);
              }}
              endIcon={<Undo />}
            >
              {tr('projectForm.undoBtnLabel')}
            </Button>
          )}
        </Box>
      )}
      <form css={newProjectFormStyle} onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <FormField
          formField="description"
          label={tr('taskForm.descriptionLabel')}
          tooltip={tr('taskForm.descriptionTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
        />

        <FormField
          formField="lifecycleState"
          label={tr('taskForm.lifecycleStateLabel')}
          tooltip={tr('taskForm.lifecycleStateTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="TehtävänElinkaarentila" readOnly={!editing} />
          )}
        />

        <FormField
          formField="taskType"
          label={tr('taskForm.taskTypeLabel')}
          tooltip={tr('taskForm.taskTypeTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="TehtäväTyyppi" readOnly={!editing} />
          )}
        />

        <FormField
          formField="startDate"
          label={tr('taskForm.startDateLabel')}
          tooltip={tr('taskForm.startDateTooltip')}
          component={(field) => (
            <FormDatePicker
              maxDate={dayjs(form.getValues('endDate'))}
              readOnly={!editing}
              field={field}
            />
          )}
        />

        <FormField
          formField="endDate"
          label={tr('taskForm.endDateLabel')}
          tooltip={tr('taskForm.endDateTooltip')}
          component={(field) => (
            <FormDatePicker
              minDate={dayjs(form.getValues('startDate'))}
              readOnly={!editing}
              field={field}
            />
          )}
        />

        {!props.task && (
          <Button
            disabled={!form.formState.isValid}
            type="submit"
            sx={{ mt: 2 }}
            variant="contained"
            color="primary"
            size="small"
            endIcon={<AddCircle />}
          >
            {tr('taskForm.createBtnLabel')}
          </Button>
        )}

        {props.task && editing && (
          <Button
            size="small"
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!form.formState.isValid || !form.formState.isDirty}
            endIcon={<Save />}
          >
            {tr('taskForm.saveBtnLabel')}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
