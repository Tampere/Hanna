import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, HourglassFullTwoTone, Save, Undo } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { authAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { getRequiredFields } from '@frontend/utils/form';

import { mergeErrors } from '@shared/formerror';
import {
  DbDetailplanProject,
  DetailplanProject,
  detailplanProjectSchema,
} from '@shared/schema/project/detailplan';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  project?: DbDetailplanProject | null;
}

const readonlyFieldProps = {
  hiddenLabel: true,
  variant: 'filled',
  InputProps: { readOnly: true },
} as const;

export function DetailPlanProjectForm(props: Props) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.project);
  const currentUser = useAtomValue(authAtom);

  const readonlyProps = useMemo(() => {
    if (editing) {
      return {};
    }
    return readonlyFieldProps;
  }, [editing]);

  const formDefaultValues = useMemo<Partial<DbDetailplanProject>>(
    () => ({
      owner: currentUser?.id,
      projectName: '',
      description: '',
      sapProjectId: null,
      diaryId: '',
      diaryDate: null,
      subtype: '',
      planningZone: '',
      preparer: '',
      technicalPlanner: null,
      district: '',
      blockName: '',
      addressText: '',
      initiativeDate: null,
      applicantName: '',
      applicantAddress: '',
      applicantObjective: '',
    }),
    [currentUser]
  );

  const { projectDetailplan } = trpc.useContext();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(detailplanProjectSchema);

    return async function formValidation(
      values: DbDetailplanProject,
      context: any,
      options: ResolverOptions<DbDetailplanProject>
    ) {
      const fields = options.names ?? [];
      const isFormValidation = fields && fields.length > 1;
      const serverErrors = isFormValidation ? projectDetailplan.upsertValidate.fetch(values) : null;
      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);
      return {
        values,
        errors: mergeErrors<DbDetailplanProject>(errors).errors,
      };
    };
  }, []);

  const form = useForm<DbDetailplanProject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(detailplanProjectSchema),
    },
    defaultValues: props.project ?? formDefaultValues,
  });

  useEffect(() => {
    form.reset(props.project ?? formDefaultValues);
  }, [props.project]);

  const projectUpsert = trpc.projectDetailplan.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.id) {
        navigate(`/asemakaavahanke/${data.id}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['projectDetailplan', 'get'], { input: { id: data.id } }],
        });
        setEditing(false);
        form.reset(data);
      }
      notify({
        severity: 'success',
        title: tr('newDetailplanProject.notifyUpsert'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('newDetailplanProject.notifyUpsertFailed'),
      });
    },
  });

  const onSubmit = (data: DetailplanProject | DbDetailplanProject) => projectUpsert.mutate(data);

  return (
    <FormProvider {...form}>
      {!props.project && (
        <Typography variant="overline">{tr('newDetailPlanProject.formTitle')}</Typography>
      )}
      {props.project && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="overline">{tr('newDetailPlanProject.formTitle')}</Typography>
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
        <FormField<DetailplanProject>
          formField="projectName"
          label={tr('project.projectNameLabel')}
          tooltip={tr('newProject.projectNameTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
          )}
        />

        <FormField<DetailplanProject>
          formField="description"
          label={tr('project.descriptionLabel')}
          tooltip={tr('newProject.descriptionTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
        />

        <FormField<DetailplanProject>
          formField="owner"
          label={tr('project.ownerLabel')}
          tooltip={tr('newProject.ownerTooltip')}
          component={({ id, onChange, value }) => (
            <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
          )}
        />

        <FormField<DetailplanProject>
          formField="diaryId"
          label={tr('detailPlanProject.diaryIdLabel')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="diaryDate"
          label={tr('detailPlanProject.diaryDateLabel')}
          component={(field) => <FormDatePicker readOnly={!editing} field={field} />}
        />

        <FormField<DbDetailplanProject>
          formField="detailplanId"
          label={tr('detailPlanProject.detailplanIdLabel')}
          component={(field) => (
            <TextField
              {...readonlyFieldProps}
              {...field}
              value={props.project?.detailplanId ?? ''}
              size="small"
              placeholder={tr('newDetailPlanProject.detailplanIdPlaceholder')}
            />
          )}
        />

        <FormField<DetailplanProject>
          formField="sapProjectId"
          label={tr('project.sapProjectIdLabel')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="subtype"
          label={tr('detailPlanProject.subtypeLabel')}
          component={({ id, onChange, value }) => (
            <CodeSelect
              id={id}
              value={value}
              onChange={onChange}
              readOnly={!editing}
              codeListId="AsemakaavaHanketyyppi"
            />
          )}
        />

        <FormField<DetailplanProject>
          formField="planningZone"
          label={tr('detailPlanProject.planningZoneLabel')}
          component={({ id, onChange, value }) => (
            <CodeSelect
              id={id}
              value={value}
              onChange={onChange}
              readOnly={!editing}
              codeListId="AsemakaavaSuunnittelualue"
            />
          )}
        />

        <FormField<DetailplanProject>
          formField="preparer"
          label={tr('detailPlanProject.preparerLabel')}
          tooltip={tr('newDetailPlanProject.preparerTooltip')}
          component={({ id, onChange, value }) => (
            <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
          )}
        />

        <FormField<DetailplanProject>
          formField="technicalPlanner"
          label={tr('detailPlanProject.technicalPlannerLabel')}
          component={({ id, onChange, value }) => (
            <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
          )}
        />

        <FormField<DetailplanProject>
          formField="district"
          label={tr('detailPlanProject.districtLabel')}
          tooltip={tr('newDetailPlanProject.districtTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="blockName"
          label={tr('detailPlanProject.blockNameLabel')}
          tooltip={tr('newDetailPlanProject.blockNameTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="addressText"
          label={tr('detailPlanProject.addressTextLabel')}
          tooltip={tr('newDetailPlanProject.addressTextTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="initiativeDate"
          label={tr('detailPlanProject.initiativeDateLabel')}
          component={(field) => <FormDatePicker readOnly={!editing} field={field} />}
        />

        <FormField<DetailplanProject>
          formField="applicantName"
          label={tr('detailPlanProject.applicantNameLabel')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="applicantAddress"
          label={tr('detailPlanProject.applicantAddressLabel')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
          )}
        />

        <FormField<DetailplanProject>
          formField="applicantObjective"
          label={tr('detailPlanProject.applicantObjectiveLabel')}
          component={(field) => (
            <TextField
              {...readonlyProps}
              {...field}
              value={field.value ?? ''}
              size="small"
              multiline
              minRows={4}
            />
          )}
        />

        <FormField<DetailplanProject>
          formField="additionalInfo"
          label={tr('detailPlanProject.additionalInfoLabel')}
          component={(field) => (
            <TextField
              {...readonlyProps}
              {...field}
              value={field.value ?? ''}
              size="small"
              multiline
              minRows={4}
            />
          )}
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
