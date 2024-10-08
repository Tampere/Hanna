import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, Save, Undo } from '@mui/icons-material';
import { Box, Button, TextField } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { getRequiredFields } from '@frontend/utils/form';

import { UpsertTask, upsertTaskSchema } from '@shared/schema/task';

const newTaskFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectObjectId: string;
  userCanModify?: boolean;
  task?: UpsertTask | null;
  onSubmit?: () => void;
}

export function TaskForm(props: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();
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
        if (val.startDate && val.endDate && dayjs(val.endDate) <= dayjs(val.startDate)) {
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
      }),
    ),
    context: {
      requiredFields: getRequiredFields(upsertTaskSchema),
    },
    defaultValues: props.task ?? {
      projectObjectId: props.projectObjectId,
      taskName: '',
      description: '',
      startDate: '',
      endDate: '',
    },
  });

  useNavigationBlocker(form.formState.isDirty, 'taskForm');

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
      setEditing(false);
      form.reset(data);
      props.onSubmit?.();

      notify({
        severity: 'success',
        title: props.task?.taskId
          ? tr('taskForm.notifyUpdateSuccess')
          : tr('taskForm.notifyCreateSuccess'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: props.task?.taskId
          ? tr('taskForm.notifyUpdateFailure')
          : tr('taskForm.notifyCreateFailure'),
      });
    },
  });

  const onSubmit = (data: UpsertTask) => {
    taskUpsert.mutate(data);
  };

  return (
    <FormProvider {...form}>
      {props.task && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <SectionTitle title={tr('taskForm.title')} />
          {!form.formState.isDirty && !editing ? (
            <Button
              variant="contained"
              size="small"
              disabled={!props.userCanModify}
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
      <form css={newTaskFormStyle} onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <FormField
          formField="taskName"
          label={tr('taskForm.taskNameLabel')}
          errorTooltip={tr('taskForm.taskNameTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
          )}
        />

        <FormField
          formField="description"
          label={tr('taskForm.descriptionLabel')}
          errorTooltip={tr('taskForm.descriptionTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
        />
        <FormField
          formField="lifecycleState"
          label={tr('taskForm.lifecycleStateLabel')}
          errorTooltip={tr('taskForm.lifecycleStateTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="TehtävänElinkaarentila" readOnly={!editing} />
          )}
        />

        <FormField
          formField="taskType"
          label={tr('taskForm.taskTypeLabel')}
          errorTooltip={tr('taskForm.taskTypeTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="TehtäväTyyppi" readOnly={!editing} showIdInLabel />
          )}
        />

        <FormField
          formField="startDate"
          label={tr('taskForm.startDateLabel')}
          errorTooltip={tr('taskForm.startDateTooltip')}
          component={(field) => (
            <FormDatePicker
              maxDate={dayjs(form.getValues('endDate')).subtract(1, 'day')}
              readOnly={!editing}
              field={field}
            />
          )}
        />

        <FormField
          formField="endDate"
          label={tr('taskForm.endDateLabel')}
          errorTooltip={tr('taskForm.endDateTooltip')}
          component={(field) => (
            <FormDatePicker
              minDate={dayjs(form.getValues('startDate')).add(1, 'day')}
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

        {props.task && (
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
