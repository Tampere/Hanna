import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, HourglassFullTwoTone, Save, Undo } from '@mui/icons-material';
import { Box, Button, TextField, Typography } from '@mui/material';
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
  DbDetailplanProject,
  DetailplanProject,
  detailplanProjectSchema,
} from '@shared/schema/project/detailplan';
import { hasWritePermission, isAdmin, ownsProject } from '@shared/schema/userPermissions';

import { ProjectOwnerChangeDialog } from '../Project/ProjectOwnerChangeDialog';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  project?: DbDetailplanProject | null;
  disabled?: boolean;
}

const readonlyFieldProps = {
  hiddenLabel: true,
  variant: 'filled',
  InputProps: { readOnly: true },
} as const;

export function DetailplanProjectForm(props: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.project);
  const currentUser = useAtomValue(asyncUserAtom);
  const [nextDetailplanId, setNextDetailplanId] = useState<number | null>(null);
  const [ownerChangeDialogOpen, setOwnerChangeDialogOpen] = useState(false);
  const [keepOwnerRights, setKeepOwnerRights] = useState(false);
  const [displayInvalidSAPIdDialog, setDisplayInvalidSAPIdDialog] = useState(false);

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
      startDate: '',
      endDate: '',
      lifecycleState: '01',
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
    [currentUser],
  );

  const { detailplanProject, user, sap } = trpc.useUtils();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(detailplanProjectSchema);

    return async function formValidation(
      values: DbDetailplanProject,
      context: any,
      options: ResolverOptions<DbDetailplanProject>,
    ) {
      const fields = options.names ?? [];
      const isFormValidation = fields && fields.length > 1;
      const serverErrors = isFormValidation
        ? detailplanProject.upsertValidate.fetch(values).catch(() => null)
        : null;
      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);
      return {
        values,
        errors: mergeErrors(errors).errors,
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

  useNavigationBlocker(form.formState.isDirty, 'detailplanForm');

  useEffect(() => {
    form.reset(props.project ?? formDefaultValues);

    // Fetch the next available detailplan ID once when the form has been loaded
    if (!props.project) {
      detailplanProject.getNextDetailplanId.fetch().then((id) => {
        setNextDetailplanId(id);
      });
    }
  }, [props.project]);

  const projectUpsert = trpc.detailplanProject.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.projectId) {
        navigate(`/asemakaavahanke/${data.projectId}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['detailplanProject', 'get'], { input: { projectId: data.projectId } }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ['project', 'getPermissions'],
            { input: { projectId: data.projectId, withAdmins: true } },
          ],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ['detailplanProject', 'previewNotificationMail'],
            { input: { projectId: data.projectId } },
          ],
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

  useEffect(() => {
    if (form.formState.isSubmitSuccessful && !props.project && !displayInvalidSAPIdDialog) {
      form.reset();
    }
  }, [form.formState.isSubmitSuccessful, form.reset]);

  const ownerWatch = form.watch('owner');

  const onSubmit = async (data: DetailplanProject | DbDetailplanProject) => {
    let validOrEmptySAPId;
    try {
      validOrEmptySAPId = data.sapProjectId
        ? await sap.doesSapProjectIdExist.fetch({
            projectId: data.sapProjectId,
          })
        : true;
    } catch (error) {
      validOrEmptySAPId = false;
    }
    if (!validOrEmptySAPId) {
      setDisplayInvalidSAPIdDialog(true);
      return;
    }
    projectUpsert.mutate({ project: data, keepOwnerRights });
    setKeepOwnerRights(false);
  };

  return (
    <>
      <FormProvider {...form}>
        {!props.project && (
          <Typography variant="overline">{tr('newDetailplanProject.formTitle')}</Typography>
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

          <FormField<DetailplanProject>
            formField="owner"
            label={tr('project.ownerLabel')}
            tooltip={tr('newProject.ownerTooltip')}
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

          <FormField<DetailplanProject>
            formField="preparer"
            label={tr('detailplanProject.preparerLabel')}
            tooltip={tr('newDetailplanProject.preparerTooltip')}
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

          <FormField<DetailplanProject>
            formField="district"
            label={tr('detailplanProject.districtLabel')}
            tooltip={tr('newDetailplanProject.districtTooltip')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
            )}
          />

          <FormField<DetailplanProject>
            formField="blockName"
            label={tr('detailplanProject.blockNameLabel')}
            tooltip={tr('newDetailplanProject.blockNameTooltip')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
            )}
          />

          <FormField<DetailplanProject>
            formField="addressText"
            label={tr('detailplanProject.addressTextLabel')}
            tooltip={tr('newDetailplanProject.addressTextTooltip')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
            )}
          />
          <FormField<DetailplanProject>
            formField="diaryId"
            label={tr('detailplanProject.diaryIdLabel')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
            )}
          />

          <FormField<DetailplanProject>
            formField="diaryDate"
            label={tr('detailplanProject.diaryDateLabel')}
            component={(field) => <FormDatePicker readOnly={!editing} field={field} />}
          />

          <FormField<DbDetailplanProject>
            formField="detailplanId"
            label={tr('detailplanProject.detailplanIdLabel')}
            component={(field) => (
              <TextField
                {...readonlyFieldProps}
                {...field}
                value={props.project?.detailplanId ?? ''}
                size="small"
                placeholder={nextDetailplanId != null ? String(nextDetailplanId) : ''}
              />
            )}
          />

          <FormField<DetailplanProject>
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

          <FormField<DetailplanProject>
            formField="subtype"
            label={tr('detailplanProject.subtypeLabel')}
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
            label={tr('detailplanProject.planningZoneLabel')}
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
            formField="technicalPlanner"
            label={tr('detailplanProject.technicalPlannerLabel')}
            component={({ id, onChange, value }) => (
              <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
            )}
          />

          <FormField<DetailplanProject>
            formField="initiativeDate"
            label={tr('detailplanProject.initiativeDateLabel')}
            component={(field) => <FormDatePicker readOnly={!editing} field={field} />}
          />

          <FormField<DetailplanProject>
            formField="applicantName"
            label={tr('detailplanProject.applicantNameLabel')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
            )}
          />

          <FormField<DetailplanProject>
            formField="applicantAddress"
            label={tr('detailplanProject.applicantAddressLabel')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} value={field.value ?? ''} size="small" />
            )}
          />

          <FormField<DetailplanProject>
            formField="applicantObjective"
            label={tr('detailplanProject.applicantObjectiveLabel')}
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
            label={tr('detailplanProject.additionalInfoLabel')}
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
          projectUpsert.mutate({ project: data, keepOwnerRights });

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
