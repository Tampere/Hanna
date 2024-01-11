import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, HourglassFullTwoTone, Save, Undo } from '@mui/icons-material';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SapProjectIdField } from '@frontend/components/forms/SapProjectIdField';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { authAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { getRequiredFields } from '@frontend/utils/form';

import { mergeErrors } from '@shared/formerror';
import {
  DbInvestmentProject,
  InvestmentProject,
  investmentProjectSchema,
} from '@shared/schema/project/investment';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface InvestmentProjectFormProps {
  edit: boolean;
  project?: DbInvestmentProject | null;
  geom: string | null;
}

export function InvestmentProjectForm(props: InvestmentProjectFormProps) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(props.edit);
  const currentUser = useAtomValue(authAtom);

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

  const formDefaultValues = useMemo<Partial<DbInvestmentProject>>(
    () => ({
      owner: currentUser?.id,
      personInCharge: currentUser?.id,
      projectName: '',
      description: '',
      startDate: '',
      endDate: '',
      lifecycleState: '01',
      sapProjectId: null,
    }),
    [currentUser]
  );

  const { investmentProject } = trpc.useContext();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(investmentProjectSchema);

    return async function formValidation(
      values: InvestmentProject,
      context: any,
      options: ResolverOptions<InvestmentProject>
    ) {
      const fields = options.names ?? [];
      const isFormValidation = fields && fields.length > 1;
      const serverErrors = isFormValidation
        ? investmentProject.upsertValidate.fetch(values).catch(() => null)
        : null;
      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);
      return {
        values,
        errors: mergeErrors(errors).errors,
      };
    };
  }, []);

  const form = useForm<InvestmentProject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(investmentProjectSchema),
    },
    defaultValues: props.project ?? formDefaultValues,
  });

  useNavigationBlocker(form.formState.isDirty, 'investmentForm');

  useEffect(() => {
    form.reset(props.project ?? formDefaultValues);
  }, [props.project]);

  const projectUpsert = trpc.investmentProject.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.id) {
        navigate(`/investointihanke/${data.id}`);
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

  const onSubmit = (data: InvestmentProject | DbInvestmentProject) => {
    projectUpsert.mutate({ ...data, geom: props.geom });
  };

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
          formField="owner"
          label={tr('project.ownerLabel')}
          tooltip={tr('newProject.ownerTooltip')}
          component={({ id, onChange, value }) => (
            <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
          )}
        />

        <FormField
          formField="personInCharge"
          label={tr('project.personInChargeLabel')}
          tooltip={tr('newProject.personInChargeTooltip')}
          component={({ id, onChange, value }) => (
            <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
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
          formField="committees"
          label={tr('project.committeeLabel')}
          tooltip={tr('newProject.committeeTooltip')}
          component={({ id, onChange, value }) => (
            <CodeSelect
              id={id}
              // Coerce the single value into an array (support for multiple committees will be added later)
              value={value?.[0]}
              onChange={(value) => onChange(!value ? [] : [value])}
              readOnly={!editing}
              codeListId="Lautakunta"
            />
          )}
        />

        <FormField
          formField="sapProjectId"
          label={tr('project.sapProjectIdLabel')}
          component={(field) => (
            <SapProjectIdField
              {...readonlyProps}
              {...field}
              value={field.value ?? ''}
              size="small"
            />
          )}
        />

        {!props.project && (
          <>
            {(!props.geom || props.geom === '[]') && (
              <Alert sx={{ mt: 1 }} severity="info">
                {tr('newProject.infoNoGeom')}
              </Alert>
            )}
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
          </>
        )}

        {props.project && editing && (
          <Button
            size="small"
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={
              !form.formState.isValid || !form.formState.isDirty || form.formState.isSubmitting
            }
            endIcon={form.formState.isSubmitting ? <HourglassFullTwoTone /> : <Save />}
          >
            {tr('projectForm.saveBtnLabel')}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}
