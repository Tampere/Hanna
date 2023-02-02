import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, Save, Undo } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { DbProject, UpsertProject, upsertProjectSchema } from '@shared/schema/project';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface ProjectFormProps {
  project?: DbProject | null;
}

export function ProjectForm(props: ProjectFormProps) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.project);

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

  const form = useForm<UpsertProject>({
    mode: 'all',
    resolver: zodResolver(
      upsertProjectSchema.superRefine((val, ctx) => {
        if (val.startDate && val.endDate && dayjs(val.endDate) <= dayjs(val.startDate)) {
          ctx.addIssue({
            path: ['startDate'],
            code: z.ZodIssueCode.custom,
            message: tr('newProject.error.endDateBeforeStartDate'),
          });
          ctx.addIssue({
            path: ['endDate'],
            code: z.ZodIssueCode.custom,
            message: tr('newProject.error.endDateBeforeStartDate'),
          });
        }
      })
    ),
    defaultValues: props.project ?? {
      projectName: '',
      description: '',
      startDate: '',
      endDate: '',
      lifecycleState: '01',
    },
  });

  useEffect(() => {
    form.reset(
      props.project ?? {
        projectName: '',
        description: '',
        startDate: '',
        endDate: '',
        sapProjectId: null,
      }
    );
  }, [props.project]);

  useEffect(() => {
    const sub = form.watch((value, { name, type }) => {
      if (type === 'change' && (name === 'startDate' || name === 'endDate')) {
        form.trigger(['startDate', 'endDate']);
      }
    });
    return () => sub.unsubscribe();
  }, [form.watch]);

  const projectUpsert = trpc.project.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.id) {
        navigate(`/hanke/${data.id}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['project', 'get'], { input: { id: data.id } }],
        });
        setEditing(false);
        form.reset(data);
      }
      notify({
        severity: 'success',
        title: tr('newProject.notifyUpsert'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('newProject.notifyUpsertFailed'),
      });
    },
  });

  const onSubmit = (data: UpsertProject | DbProject) => projectUpsert.mutate(data);

  return (
    <FormProvider {...form}>
      {!props.project && <Typography variant="overline">{tr('newProject.formTitle')}</Typography>}
      {props.project && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="overline">{tr('projectForm.formTitle')}</Typography>
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
          formField="projectName"
          label={tr('project.projectNameLabel')}
          tooltip={tr('newProject.projectNameTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
          )}
        />

        <FormField
          formField="description"
          label={tr('project.descriptionLabel')}
          tooltip={tr('newProject.descriptionTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
        />

        <FormField
          formField="startDate"
          label={tr('project.startDateLabel')}
          tooltip={tr('newProject.startDateTooltip')}
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
          label={tr('project.endDateLabel')}
          tooltip={tr('newProject.endDateTooltip')}
          component={(field) => (
            <FormDatePicker
              minDate={dayjs(form.getValues('startDate')).add(1, 'day')}
              readOnly={!editing}
              field={field}
            />
          )}
        />

        <FormField
          formField="lifecycleState"
          label={tr('project.lifecycleStateLabel')}
          tooltip={tr('newProject.lifecycleStateTooltip')}
          component={({ id, onChange, value }) => (
            <CodeSelect
              id={id}
              value={value}
              onChange={onChange}
              readOnly={!editing}
              codeListId="HankkeenElinkaarentila"
            />
          )}
        />

        <FormField
          formField="projectType"
          label={tr('project.projectTypeLabel')}
          tooltip={tr('newProject.projectTypeTooltip')}
          component={({ id, onChange, value }) => (
            <CodeSelect
              id={id}
              value={value}
              onChange={onChange}
              readOnly={!editing}
              codeListId="HankeTyyppi"
            />
          )}
        />

        <FormField
          formField="sapProjectId"
          label={tr('project.sapProjectIdLabel')}
          component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
        />

        {!props.project && (
          <Button
            disabled={!form.formState.isValid}
            type="submit"
            sx={{ mt: 2 }}
            variant="contained"
            color="primary"
            size="small"
            endIcon={<AddCircle />}
          >
            {tr('newProject.createBtnLabel')}
          </Button>
        )}

        {props.project && editing && (
          <Button
            size="small"
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!form.formState.isValid || !form.formState.isDirty}
            endIcon={<Save />}
          >
            {tr('projectForm.saveBtnLabel')}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
