import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, TextField, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import { FormDatePicker, FormField, getDateFieldErrorMessage } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { FormCheckBox } from '@frontend/components/forms/FormCheckBox';
import { SapProjectIdField } from '@frontend/components/forms/SapProjectIdField';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { getRequiredFields } from '@frontend/utils/form';
import { ProjectOwnerChangeDialog } from '@frontend/views/Project/ProjectOwnerChangeDialog';

import { mergeErrors } from '@shared/formerror';
import {
  DbMaintenanceProject,
  MaintenanceProject,
  maintenanceProjectSchema,
} from '@shared/schema/project/maintenance';
import { isAdmin, ownsProject } from '@shared/schema/userPermissions';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface MaintenanceProjectFormProps {
  project?: DbMaintenanceProject | null;
  coversMunicipality: boolean;
  setCoversMunicipality: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel?: () => void;
  getDrawGeometry: () => string;
}

export const MaintenanceProjectForm = forwardRef(function MaintenanceProjectForm(
  props: MaintenanceProjectFormProps,
  ref,
) {
  const { coversMunicipality, setCoversMunicipality } = props;

  useImperativeHandle(
    ref,
    () => ({
      onSave: (geom?: string) => {
        form.handleSubmit((data) => onSubmit(data, geom))();
      },
      onCancel: () => {
        form.reset();
        externalForm.reset();
        setCoversMunicipality(form.getValues('coversMunicipality'));
      },
    }),
    [coversMunicipality],
  );

  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const currentUser = useAtomValue(asyncUserAtom);
  const setDirtyAndValidViews = useSetAtom(dirtyAndValidFieldsAtom);
  const [ownerChangeDialogOpen, setOwnerChangeDialogOpen] = useState(false);
  const [keepOwnerRights, setKeepOwnerRights] = useState(false);
  const [displayInvalidSAPIdDialog, setDisplayInvalidSAPIdDialog] = useState(false);
  const [editing, setEditing] = useAtom(projectEditingAtom);
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

  const formDefaultValues = useMemo<Partial<DbMaintenanceProject>>(
    () => ({
      owner: currentUser?.id,
      projectName: '',
      description: '',
      startDate: '',
      endDate: '',
      contract: '',
      decision: '',
      poNumber: '',
      lifecycleState: '01',
      sapProjectId: null,
      coversMunicipality: false,
    }),
    [currentUser],
  );

  const { maintenanceProject } = trpc.useUtils();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(maintenanceProjectSchema);

    return async function formValidation(
      values: MaintenanceProject,
      context: any,
      options: ResolverOptions<MaintenanceProject>,
    ) {
      const fields = options.names ?? [];
      const isFormValidation =
        fields &&
        (Boolean(props.project && (fields.includes('startDate') || fields.includes('endDate'))) ||
          fields.length > 1);
      const serverErrors = isFormValidation
        ? maintenanceProject.upsertValidate.fetch({ ...values, geom: undefined }).catch(() => null)
        : null;
      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);
      return {
        values,
        errors: mergeErrors(errors).errors,
      };
    };
  }, []);

  const form = useForm<MaintenanceProject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(maintenanceProjectSchema),
    },
    defaultValues: props.project
      ? {
          ...props.project,
          contract: props.project?.contract ?? '',
          decision: props.project?.decision ?? '',
          poNumber: props.project?.poNumber ?? '',
        }
      : formDefaultValues,
  });

  function handleBudgetUpdateEvent() {
    form.trigger('endDate');
    document.removeEventListener('budgetUpdated', handleBudgetUpdateEvent);
  }

  useEffect(() => {
    if (form.formState.errors.endDate?.message === 'project.error.budgetNotIncludedForOngoing') {
      document.addEventListener('budgetUpdated', handleBudgetUpdateEvent);
    }
  }, [form.formState.errors.endDate]);

  const externalForm = useForm<{ coversMunicipality: boolean }>({
    mode: 'all',
    defaultValues: {
      coversMunicipality: props.project?.coversMunicipality ?? false,
    },
    values: { coversMunicipality: coversMunicipality },
    resetOptions: { keepDefaultValues: true },
  });

  useNavigationBlocker(form.formState.isDirty, 'maintenanceForm');
  const ownerWatch = form.watch('owner');
  const endDateWatch = form.watch('endDate');

  useEffect(() => {
    if (!props.project) {
      setDirtyAndValidViews((prev) => ({ ...prev, form: form.formState.isValid }));
    } else {
      setDirtyAndValidViews((prev) => ({
        ...prev,
        form: !submitDisabled(),
      }));
    }
  }, [
    props.project,
    form.formState.isValid,
    form.formState.isDirty,
    externalForm.formState.isDirty,
  ]);

  useEffect(() => {
    form.reset(
      props.project
        ? {
            ...props.project,
            contract: props.project?.contract ?? '',
            decision: props.project?.decision ?? '',
            poNumber: props.project?.poNumber ?? '',
          }
        : formDefaultValues,
    );
  }, [props.project]);

  const projectUpsert = trpc.maintenanceProject.upsert.useMutation({
    onSuccess: async (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.projectId) {
        navigate(`/kunnossapitohanke/${data.projectId}`);
      } else {
        await queryClient.invalidateQueries({
          queryKey: [['maintenanceProject', 'get'], { input: { projectId: data.projectId } }],
        });

        await queryClient.invalidateQueries({
          queryKey: [
            ['project', 'getPermissions'],
            { input: { projectId: data.projectId, withAdmins: true } },
          ],
        });

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

  const onSubmit = async (data: MaintenanceProject | DbMaintenanceProject, geom?: string) => {
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
      project: { ...data, geom: geom ?? null, coversMunicipality: coversMunicipality },
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
          <Typography variant="overline">{tr('newMaintenanceProject.formTitle')}</Typography>
        )}
        {props.project && <Typography variant="overline">{tr('projectForm.formTitle')}</Typography>}
        <form css={newProjectFormStyle} autoComplete="off">
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
            errorTooltip={getDateFieldErrorMessage(
              form.formState.errors.startDate?.message ?? null,
              tr('newProject.startDateTooltip'),
            )}
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
            errorTooltip={getDateFieldErrorMessage(
              form.formState.errors.endDate?.message ?? null,
              tr('newProject.endDateTooltip'),
              [dayjs(form.getValues('startDate')).add(5, 'year').year().toString()],
            )}
            component={(field) => (
              <Box
                css={css`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 1rem;
                  & .MuiFormControl-root {
                    flex: 1 1 185px;
                  }
                `}
              >
                <FormDatePicker
                  minDate={dayjs(form.getValues('startDate')).add(1, 'day')}
                  readOnly={!editing || endDateWatch === 'infinity'}
                  field={field}
                />
                <FormCheckBox
                  cssProp={css`
                    flex: 1;
                    margin-right: 0;
                    justify-content: flex-end;
                  `}
                  disabled={!editing}
                  onChange={() => {
                    if (endDateWatch === 'infinity') {
                      form.setValue('endDate', '');
                    } else {
                      field.onChange('infinity');
                    }
                  }}
                  checked={endDateWatch === 'infinity'}
                  label={tr('maintenanceProject.ongoing')}
                />
              </Box>
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
            formField="contract"
            label={tr('maintenanceProject.contract')}
            component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
          />
          <FormField
            formField="decision"
            label={tr('maintenanceProject.decision')}
            component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
          />
          <FormField
            formField="poNumber"
            label={tr('maintenanceProject.poNumber')}
            component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
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
          const { coversMunicipality } = externalForm.getValues();
          projectUpsert.mutate({
            project: { ...data, geom: props.getDrawGeometry(), coversMunicipality },
            keepOwnerRights,
          });

          setDisplayInvalidSAPIdDialog(false);
        }}
        onCancel={() => {
          form.reset(undefined, { keepValues: true });
          setDisplayInvalidSAPIdDialog(false);
          setEditing(true);
        }}
      />
    </>
  );
});
