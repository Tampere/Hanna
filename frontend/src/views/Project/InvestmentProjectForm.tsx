import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, HourglassFullTwoTone, Save, Undo } from '@mui/icons-material';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SapProjectIdField } from '@frontend/components/forms/SapProjectIdField';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { getRequiredFields } from '@frontend/utils/form';

import { mergeErrors } from '@shared/formerror';
import {
  DbInvestmentProject,
  InvestmentProject,
  investmentProjectSchema,
} from '@shared/schema/project/investment';
import { hasWritePermission, isAdmin, ownsProject } from '@shared/schema/userPermissions';

import { ProjectOwnerChangeDialog } from './ProjectOwnerChangeDialog';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface InvestmentProjectFormProps {
  project?: DbInvestmentProject | null;
  geom: string | null;
  coversMunicipality: boolean;
  setCoversMunicipality: React.Dispatch<React.SetStateAction<boolean>>;
  editing: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel?: () => void;
}

export function InvestmentProjectForm(props: InvestmentProjectFormProps) {
  const { coversMunicipality, setCoversMunicipality, editing, setEditing } = props;
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const currentUser = useAtomValue(asyncUserAtom);
  const [ownerChangeDialogOpen, setOwnerChangeDialogOpen] = useState(false);
  const [keepOwnerRights, setKeepOwnerRights] = useState(false);
  const [displayInvalidSAPIdDialog, setDisplayInvalidSAPIdDialog] = useState(false);
  const { user, sap } = trpc.useUtils();

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
      projectName: '',
      description: '',
      startDate: '',
      endDate: '',
      lifecycleState: '01',
      sapProjectId: null,
      coversMunicipality: false,
    }),
    [currentUser],
  );

  const { investmentProject } = trpc.useUtils();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(investmentProjectSchema);

    return async function formValidation(
      values: InvestmentProject,
      context: any,
      options: ResolverOptions<InvestmentProject>,
    ) {
      const fields = options.names ?? [];
      const isFormValidation = fields && fields.length > 1;

      const serverErrors = isFormValidation
        ? investmentProject.upsertValidate.fetch({ ...values, geom: undefined }).catch(() => null)
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

  const externalForm = useForm<{ coversMunicipality: boolean }>({
    mode: 'all',
    defaultValues: {
      coversMunicipality: props.project?.coversMunicipality ?? false,
    },
    values: { coversMunicipality: coversMunicipality },
    resetOptions: { keepDefaultValues: true },
  });

  useNavigationBlocker(form.formState.isDirty, 'investmentForm');
  const ownerWatch = form.watch('owner');

  useEffect(() => {
    form.reset(props.project ?? formDefaultValues);
  }, [props.project]);

  const projectUpsert = trpc.investmentProject.upsert.useMutation({
    onSuccess: async (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.projectId) {
        navigate(`/investointihanke/${data.projectId}`);
      } else {
        await queryClient.invalidateQueries({
          queryKey: [['investmentProject', 'get'], { input: { projectId: data.projectId } }],
        });

        await queryClient.invalidateQueries({
          queryKey: [
            ['project', 'getPermissions'],
            { input: { projectId: data.projectId, withAdmins: true } },
          ],
        });

        setEditing(false);
        form.reset(data);
        externalForm.reset({ coversMunicipality: data.coversMunicipality });
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

  useEffect(() => {
    if (form.formState.isSubmitSuccessful && !props.project && !displayInvalidSAPIdDialog) {
      form.reset();
    }
  }, [form.formState.isSubmitSuccessful, form.reset, displayInvalidSAPIdDialog]);

  const onSubmit = async (data: InvestmentProject | DbInvestmentProject) => {
    let validOrEmptySAPId;
    try {
      validOrEmptySAPId = data.sapProjectId
        ? await sap.doesSapProjectIdExist.fetch({
            projectId: data.sapProjectId,
          })
        : true;
    } catch {
      validOrEmptySAPId = false;
    }
    if (!validOrEmptySAPId) {
      setDisplayInvalidSAPIdDialog(true);
      return;
    }

    projectUpsert.mutate({
      project: {
        ...data,
        geom: props.geom,
        coversMunicipality: coversMunicipality,
      },
      keepOwnerRights,
    });
  };

  function submitDisabled() {
    if (externalForm.formState.isDirty) {
      return !form.formState.isValid || form.formState.isSubmitting;
    }
    return !form.formState.isValid || !form.formState.isDirty || form.formState.isSubmitting;
  }

  return (
    <>
      <FormProvider {...form}>
        {!props.project && (
          <Typography variant="overline">{tr('newInvestmentProject.formTitle')}</Typography>
        )}
        {props.project && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="overline">{tr('projectForm.formTitle')}</Typography>
            {!form.formState.isDirty && !editing ? (
              <Button
                variant="contained"
                size="small"
                disabled={
                  !(
                    !currentUser ||
                    ownsProject(currentUser, props.project) ||
                    hasWritePermission(currentUser, props.project)
                  )
                }
                onClick={() => {
                  setEditing(!editing);
                }}
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
                  externalForm.reset();
                  setCoversMunicipality(form.getValues('coversMunicipality'));
                  setEditing(!editing);
                  props.onCancel?.();
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
            errorTooltip={tr('newProject.projectNameErrorTooltip')}
            helpTooltip={tr('newProject.projectNameTooltip')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
            )}
          />

          <FormField
            formField="description"
            label={tr('project.descriptionLabel')}
            errorTooltip={tr('newProject.descriptionErrorTooltip')}
            helpTooltip={tr('newProject.descriptionTooltip')}
            component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
          />

          <FormField
            formField="startDate"
            label={tr('project.startDateLabel')}
            errorTooltip={tr('newProject.startDateTooltip')}
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
            errorTooltip={tr('newProject.endDateTooltip')}
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
            errorTooltip={tr('newProject.ownerTooltip')}
            component={({ id, onChange, value }) => (
              <UserSelect
                id={id}
                value={value}
                onChange={(newUserId) => {
                  onChange(newUserId);

                  if (props?.project?.owner && newUserId) {
                    user.get.fetch({ userId: props.project.owner }).then((projectOwner) => {
                      if (
                        projectOwner &&
                        !isAdmin(projectOwner.role) &&
                        !props.project?.writeUsers.includes(projectOwner.id) &&
                        projectOwner?.id !== newUserId
                      ) {
                        setOwnerChangeDialogOpen(true);
                      }
                    });
                  }
                }}
                readOnly={
                  !editing || Boolean(props.project && !ownsProject(currentUser, props.project))
                }
              />
            )}
          />

          <FormField
            formField="lifecycleState"
            label={tr('project.lifecycleStateLabel')}
            errorTooltip={tr('newProject.lifecycleStateTooltip')}
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
            errorTooltip={tr('newProject.committeeTooltip')}
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
              disabled={submitDisabled()}
              endIcon={form.formState.isSubmitting ? <HourglassFullTwoTone /> : <Save />}
            >
              {tr('projectForm.saveBtnLabel')}
            </Button>
          )}
        </form>
      </FormProvider>
      <ProjectOwnerChangeDialog
        newOwnerId={ownerWatch}
        isOpen={ownerChangeDialogOpen}
        keepOwnerRights={keepOwnerRights}
        setKeepOwnerRights={setKeepOwnerRights}
        onCancel={() => {
          form.resetField('owner');
          setKeepOwnerRights(false);
          setOwnerChangeDialogOpen(false);
        }}
        onSave={(keepOwnerRights) => {
          setKeepOwnerRights(keepOwnerRights);
          setOwnerChangeDialogOpen(false);
        }}
      />
      <ConfirmDialog
        title={tr('projectForm.invalidSAPId')}
        content={tr('projectForm.invalidSAPIdConfirmation')}
        cancelButtonVariant="contained"
        cancelButtonLabel={tr('cancel')}
        confirmButtonLabel={tr('genericForm.save')}
        isOpen={displayInvalidSAPIdDialog}
        onConfirm={() => {
          const data = form.getValues();
          projectUpsert.mutate({
            project: { ...data, geom: props.geom, coversMunicipality: props.coversMunicipality },
            keepOwnerRights,
          });
          setDisplayInvalidSAPIdDialog(false);
        }}
        onCancel={() => {
          form.reset(undefined, { keepValues: true });
          setDisplayInvalidSAPIdDialog(false);
        }}
      />
    </>
  );
}
