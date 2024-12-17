import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { ConfirmDialog } from '@frontend/components/dialogs/ConfirmDialog';
import {
  FormDatePicker,
  FormField,
  getDateFieldErrorMessage,
  getFormValidator,
} from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { CommitteeChangeAlert } from '@frontend/components/forms/CommitteeChangeAlert';
import { CommitteeSelect } from '@frontend/components/forms/CommitteeSelect';
import { SapProjectIdField } from '@frontend/components/forms/SapProjectIdField';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { getRequiredFields } from '@frontend/utils/form';

import {
  DbInvestmentProject,
  InvestmentProject,
  investmentProjectSchema,
} from '@shared/schema/project/investment';
import { isAdmin, ownsProject } from '@shared/schema/userPermissions';

import { ProjectOwnerChangeDialog } from './ProjectOwnerChangeDialog';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface InvestmentProjectFormProps {
  project?: DbInvestmentProject | null;
  coversMunicipality: boolean;
  setCoversMunicipality: React.Dispatch<React.SetStateAction<boolean>>;
  onCancel?: () => void;
  getDrawGeometry: () => string;
}

export const InvestmentProjectForm = forwardRef(function InvestmentProjectForm(
  props: InvestmentProjectFormProps,
  ref,
) {
  const { coversMunicipality, setCoversMunicipality } = props;

  useImperativeHandle(
    ref,
    () => ({
      onSave: async (geom?: string) => {
        await handleSubmit(
          async (data) => await onSubmit(data, geom),
          () => {
            notify({
              severity: 'error',
              title: tr('newProject.notifyUpsertFailed'),
            });
            throw new Error('Form validation failed');
          },
        )();
      },
      onCancel: () => {
        reset();
        resetExternal();
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
  const [newProjectId, setNewProjectId] = useState<string | null>(null);

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
      target: '01',
      sapProjectId: null,
      coversMunicipality: false,
    }),
    [currentUser],
  );

  const { investmentProject } = trpc.useUtils();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(investmentProjectSchema);

    return getFormValidator<InvestmentProject>(
      schemaValidation,
      investmentProject.upsertValidate.fetch,
    );
  }, []);

  const form = useForm<InvestmentProject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(investmentProjectSchema),
      getErrors: () => form.formState.errors,
    },
    defaultValues: props.project ?? formDefaultValues,
  });

  const {
    handleSubmit,
    reset,
    watch,
    resetField,
    formState: { isDirty, isValid, isSubmitSuccessful, isSubmitting, errors },
    getValues,
  } = form;

  const {
    formState: { isDirty: externalIsDirty },
    getValues: externalGetValues,
    reset: resetExternal,
  } = useForm<{ coversMunicipality: boolean }>({
    mode: 'all',
    defaultValues: {
      coversMunicipality: props.project?.coversMunicipality ?? false,
    },
    values: { coversMunicipality: coversMunicipality },
    resetOptions: { keepDefaultValues: true },
  });

  const { isBlocking } = useNavigationBlocker(isDirty || externalIsDirty, 'investmentForm');
  const ownerWatch = watch('owner');
  const committeeWatch = watch('committees');

  const removedProjectCommittees = useMemo(() => {
    if (!props.project) {
      return [];
    }
    return props.project.committees.filter((committee) => !committeeWatch.includes(committee));
  }, [committeeWatch, props.project]);

  useEffect(() => {
    if (!props.project) {
      setDirtyAndValidViews((prev) => ({
        ...prev,
        form: { isDirty, isValid: isValid },
      }));
    } else {
      setDirtyAndValidViews((prev) => ({
        ...prev,
        form: { isDirty: isDirty || externalIsDirty, isValid: !submitDisabled() },
      }));
    }
  }, [isValid, isDirty, externalIsDirty]);

  useEffect(() => {
    reset(props.project ?? formDefaultValues);
  }, [props.project]);

  useEffect(() => {
    if (newProjectId && !isBlocking) {
      navigate(`/investointihanke/${newProjectId}`);
      notify({
        severity: 'success',
        title: tr('newProject.notifyUpsert'),
        duration: 5000,
      });
    }
  }, [newProjectId, isBlocking]);

  const projectUpsert = trpc.investmentProject.upsert.useMutation({
    onSuccess: async (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.projectId) {
        setNewProjectId(data.projectId);
        // Navigation to new project is handled in useEffect
        reset(data);
        resetExternal({ coversMunicipality: data.coversMunicipality });
        return;
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

        reset(data);
        resetExternal({ coversMunicipality: data.coversMunicipality });
      }
      notify({
        severity: 'success',
        title: tr('newProject.notifyUpsert'),
        duration: 5000,
      });
    },
    onError: () => {
      if (!editing) {
        setEditing(true);
      }
      notify({
        severity: 'error',
        title: tr('newProject.notifyUpsertFailed'),
      });
    },
  });

  useEffect(() => {
    if (isSubmitSuccessful && !props.project && !displayInvalidSAPIdDialog) {
      reset();
    }
  }, [isSubmitSuccessful, reset, displayInvalidSAPIdDialog]);

  const onSubmit = async (data: InvestmentProject | DbInvestmentProject, geom?: string) => {
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
    await projectUpsert.mutateAsync({
      project: {
        ...data,
        geom: geom ?? null,
        coversMunicipality: coversMunicipality,
      },
      keepOwnerRights,
    });
  };

  function submitDisabled() {
    if (externalIsDirty) {
      return Boolean(errors.root?.committeeFinancialsError) || !isValid || isSubmitting;
    }
    return Boolean(errors.root?.committeeFinancialsError) || !isValid || !isDirty || isSubmitting;
  }

  return (
    <>
      <FormProvider {...form}>
        {!props.project && (
          <Typography variant="overline">{tr('newInvestmentProject.formTitle')}</Typography>
        )}
        {props.project && (
          <Typography variant="overline">{tr('projectForm.investmentFormTitle')}</Typography>
        )}
        <form css={newProjectFormStyle} autoComplete="off">
          <FormField
            formField="projectName"
            label={tr('project.projectNameLabel')}
            errorTooltip={tr('newProject.projectNameErrorTooltip')}
            helpTooltip={tr('newProject.projectNameTooltip')}
            component={(field) => (
              <TextField
                {...readonlyProps}
                {...field}
                size="small"
                autoFocus={!props.project && editing}
              />
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
              errors.startDate?.message ?? null,
              tr('newProject.startDateTooltip'),
            )}
            component={(field) => (
              <FormDatePicker
                maxDate={dayjs(getValues('endDate')).subtract(1, 'day')}
                readOnly={!editing}
                field={field}
              />
            )}
          />
          <FormField
            formField="endDate"
            label={tr('project.endDateLabel')}
            errorTooltip={getDateFieldErrorMessage(
              errors.endDate?.message ?? null,
              tr('newProject.endDateTooltip'),
            )}
            component={(field) => (
              <FormDatePicker
                minDate={dayjs(getValues('startDate')).add(1, 'day')}
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
            component={({ id, onChange, value, onBlur }) => (
              <>
                <CommitteeSelect
                  id={id}
                  onBlur={onBlur}
                  value={value}
                  onChange={(value) => onChange(!value ? [] : value)}
                  readOnly={!editing}
                  projectId={props.project?.projectId}
                  itemType="project"
                />
                {form.formState.dirtyFields.committees && props.project?.projectId && (
                  <CommitteeChangeAlert
                    itemType="project"
                    isVisible={Boolean(errors.root?.committeeFinancialsError)}
                    onDelete={() => {
                      form.clearErrors('root.committeeFinancialsError');
                      setDirtyAndValidViews((prev) => ({
                        ...prev,
                        form: { isDirty: isDirty || externalIsDirty, isValid: !submitDisabled() },
                      }));
                    }}
                    onCancel={() => {
                      form.resetField('committees');
                      form.clearErrors('root.committeeFinancialsError');
                    }}
                    setFormError={() => {
                      form.setError('root.committeeFinancialsError', {
                        type: 'custom',
                      });
                    }}
                    projectId={props.project.projectId}
                    removedCommittees={removedProjectCommittees}
                  />
                )}
              </>
            )}
          />

          <FormField
            formField="target"
            label={tr('project.target')}
            errorTooltip={tr('newProject.targetTooltip')}
            component={({ id, onChange, value }) => (
              <CodeSelect
                id={id}
                value={value}
                onChange={onChange}
                readOnly={!editing}
                codeListId="HankkeenSitovuus"
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
        </form>
      </FormProvider>
      <ProjectOwnerChangeDialog
        newOwnerId={ownerWatch}
        isOpen={ownerChangeDialogOpen}
        keepOwnerRights={keepOwnerRights}
        setKeepOwnerRights={setKeepOwnerRights}
        onCancel={() => {
          resetField('owner');
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
          const data = getValues();
          const { coversMunicipality } = externalGetValues();
          projectUpsert.mutate({
            project: { ...data, geom: props.getDrawGeometry(), coversMunicipality },
            keepOwnerRights,
          });

          setDisplayInvalidSAPIdDialog(false);
        }}
        onCancel={() => {
          setEditing(true);
          reset(undefined, { keepValues: true });
          setDisplayInvalidSAPIdDialog(false);
        }}
      />
    </>
  );
});
