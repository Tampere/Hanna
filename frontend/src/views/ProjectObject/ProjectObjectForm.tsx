import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, Save, Undo } from '@mui/icons-material';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
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

import { UpsertProjectObject, upsertProjectObjectSchema } from '@shared/schema/projectObject';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectId: string;
  projectObject?: UpsertProjectObject | null;
}

export function ProjectObjectForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.projectObject);

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

  const form = useForm<UpsertProjectObject>({
    mode: 'all',
    resolver: zodResolver(
      upsertProjectObjectSchema.superRefine((val, ctx) => {
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
    defaultValues: props.projectObject ?? {
      projectId: props.projectId,
      objectName: '',
      description: '',
      personResponsible: '',
      startDate: '',
      endDate: '',
    },
  });

  useEffect(() => {
    if (props.projectObject) {
      form.reset(props.projectObject);
    }
  }, [props.projectObject]);

  useEffect(() => {
    const sub = form.watch((value, { name, type }) => {
      if (type === 'change' && (name === 'startDate' || name === 'endDate')) {
        form.trigger(['startDate', 'endDate']);
      }
    });
    return () => sub.unsubscribe();
  }, [form.watch]);

  const projectObjectUpsert = trpc.projectObject.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.projectObject && data.id) {
        navigate(`/hanke/${data.projectId}/kohde/${data.id}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['project', 'get'], { input: { id: data.id } }],
        });
        // invalidate projectobject query
        queryClient.invalidateQueries({
          queryKey: [['projectObject', 'get'], { input: { id: data.id } }],
        });

        setEditing(false);
        form.reset(data);
      }
      notify({
        severity: 'success',
        title: tr('newProjectObject.notifyUpsert'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('newProjectObject.notifyUpsertFailed'),
      });
    },
  });

  const onSubmit = (data: UpsertProjectObject) => projectObjectUpsert.mutate(data);

  return (
    <FormProvider {...form}>
      {!props.projectObject && (
        <Typography variant="overline">{tr('newProjectObject.title')}</Typography>
      )}
      {props.projectObject && (
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
          formField="objectName"
          label={tr('projectObject.nameLabel')}
          tooltip={tr('projectObject.nameTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
          )}
        />

        <FormField
          formField="description"
          label={tr('projectObject.descriptionLabel')}
          tooltip={tr('projectObject.descriptionTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
        />

        <FormField
          formField="personResponsible"
          label={tr('projectObject.personResponsibleLabel')}
          tooltip={tr('projectObject.personResponsibleTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
        />

        <FormField
          formField="lifecycleState"
          label={tr('projectObject.lifecycleStateLabel')}
          tooltip={tr('projectObject.lifecycleStateTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="KohteenElinkaarentila" readOnly={!editing} />
          )}
        />

        <FormField
          formField="objectType"
          label={tr('projectObject.objectTypeLabel')}
          tooltip={tr('projectObject.objectTypeTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="KohdeTyyppi" readOnly={!editing} />
          )}
        />

        <FormField
          formField="objectCategory"
          label={tr('projectObject.objectCategoryLabel')}
          tooltip={tr('projectObject.objectCategoryTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="KohteenOmaisuusLuokka" readOnly={!editing} />
          )}
        />

        <FormField
          formField="objectUsage"
          label={tr('projectObject.objectUsageLabel')}
          tooltip={tr('projectObject.objectUsageTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect
              {...field}
              codeListId="KohteenToiminnallinenKayttoTarkoitus"
              readOnly={!editing}
            />
          )}
        />

        <FormField
          formField="startDate"
          label={tr('projectObject.startDateLabel')}
          tooltip={tr('projectObject.startDateTooltip')}
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
          label={tr('projectObject.endDateLabel')}
          tooltip={tr('projectObject.endDateTooltip')}
          component={(field) => (
            <FormDatePicker
              minDate={dayjs(form.getValues('startDate'))}
              readOnly={!editing}
              field={field}
            />
          )}
        />
        <FormField
          formField="landownership"
          label={tr('projectObject.landownershipLabel')}
          tooltip={tr('projectObject.landownershipTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="KohteenMaanomistusLaji" readOnly={!editing} />
          )}
        />

        <FormField
          formField="locationOnProperty"
          label={tr('projectObject.locationOnPropertyLabel')}
          tooltip={tr('projectObject.locationOnPropertyTooltip')}
          component={({ ref, ...field }) => (
            <CodeSelect {...field} codeListId="KohteenSuhdePeruskiinteistoon" readOnly={!editing} />
          )}
        />

        <FormField
          formField="height"
          label={tr('projectObject.heightLabel')}
          tooltip={tr('projectObject.heightTooltip')}
          component={(field) => (
            <TextField
              {...readonlyProps}
              {...field}
              size="small"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>,
              }}
            />
          )}
        />

        {!props.projectObject && (
          <Button
            disabled={!form.formState.isValid}
            type="submit"
            sx={{ mt: 2 }}
            variant="contained"
            color="primary"
            size="small"
            endIcon={<AddCircle />}
          >
            {tr('projectObjectForm.createBtnLabel')}
          </Button>
        )}

        {props.projectObject && editing && (
          <Button
            size="small"
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!form.formState.isValid || !form.formState.isDirty}
            endIcon={<Save />}
          >
            {tr('projectObjectForm.saveBtnLabel')}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
