import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FieldErrors, FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField, getDateFieldErrorMessage } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { FormCheckBox } from '@frontend/components/forms/FormCheckBox';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';
import { getRequiredFields } from '@frontend/utils/form';
import { SapWBSSelect } from '@frontend/views/ProjectObject/SapWBSSelect';

import { mergeErrors } from '@shared/formerror';
import { isTranslationKey } from '@shared/language';
import {
  UpsertMaintenanceProjectObject,
  newMaintenanceProjectObjectSchema,
  upsertMaintenanceProjectObjectSchema,
} from '@shared/schema/projectObject/maintenance';

import { ProjectObjectFormUserRoles } from './ProjectObjectFormUserRoles';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectId: string;
  projectType: ProjectTypePath;
  projectObject?: UpsertMaintenanceProjectObject | null;
  setProjectId?: (projectId: string) => void;
  userIsOwner?: boolean;
  userCanWrite?: boolean;
}

export const MaintenanceProjectObjectForm = forwardRef(function MaintenanceProjectObjectForm(
  props: Readonly<Props>,
  ref,
) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setDirtyAndValidViews = useSetAtom(dirtyAndValidFieldsAtom);
  const editing = useAtomValue(projectEditingAtom);
  const [newProjectObjectIds, setNewProjectObjectIds] = useState<{
    projectObjectId: string;
    projectId: string;
  } | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      onSave: async (geom: string) => {
        await handleSubmit(async (data) => await onSubmit(data, geom))();
      },
      onCancel: () => {
        form.reset();
      },
    }),
    [],
  );

  const { maintenanceProject } = trpc.useUtils();

  const projectUpsert = trpc.maintenanceProject.upsert.useMutation({
    onSuccess: () => {
      notify({
        severity: 'success',
        title: tr('projectObject.notifyProjectDateRangeUpdated'),
        duration: 5000,
      });
      form.trigger(['startDate', 'endDate']);
    },
    onError: async (e) => {
      const messageArray = e.message.split('"').filter((item) => isTranslationKey(item));
      const project = await maintenanceProject.get.fetch({ projectId: props.projectId });
      notify({
        severity: 'error',
        title: tr('projectObject.notifyProjectDateRangeUpdateError'),
        duration: 5000,
        message: messageArray
          .map((item) => {
            if (item === 'project.error.budgetNotIncludedForOngoing') {
              return tr(item, dayjs(project.startDate).year() + 5).toString();
            }
            return tr(item);
          })
          .join('\n'),
      });
    },
  });

  async function handleProjectDateUpsert(
    projectId: string,
    startDate?: string | null,
    endDate?: string | null,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { geom, ...projectData } = await maintenanceProject.get.fetch({ projectId });

    projectUpsert.mutate({
      project: {
        ...projectData,
        projectId: projectData.parentId,
        startDate: startDate ?? projectData.startDate,
        endDate: endDate ?? projectData.endDate,
      },
    });
  }

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

  const { projectObject } = trpc.useUtils();
  const formValidator = useMemo(() => {
    const schemaValidation = zodResolver(upsertMaintenanceProjectObjectSchema);

    return async function formValidation(
      values: UpsertMaintenanceProjectObject,
      context: { getRequiredFields: typeof getRequiredFields; getErrors: () => FieldErrors },
      options: ResolverOptions<UpsertMaintenanceProjectObject>,
    ) {
      const fields = options.names ?? [];

      const currentErrors = context.getErrors();
      const needsDateValidation =
        currentErrors.startDate ||
        currentErrors.endDate ||
        fields.includes('startDate') ||
        fields.includes('endDate');

      const isFormValidation = (fields && needsDateValidation) || fields.length > 1;

      const serverErrors = isFormValidation
        ? projectObject.upsertValidate
            .fetch({ ...values, geom: undefined, geometryDump: undefined })
            .catch(() => null)
        : null;

      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);

      return {
        values,
        errors: mergeErrors(errors).errors,
      };
    };
  }, []);

  function getErrors() {
    return form.formState.errors;
  }

  const form = useForm<UpsertMaintenanceProjectObject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(newMaintenanceProjectObjectSchema),
      getErrors,
    },
    defaultValues: props.projectObject
      ? {
          ...props.projectObject,
          contract: props.projectObject?.contract ?? '',
          poNumber: props.projectObject?.poNumber ?? '',
          procurementMethod: props.projectObject?.procurementMethod,
        }
      : {
          projectId: props.projectId,
          objectName: '',
          description: '',
          startDate: '',
          endDate: '',
          contract: '',
          poNumber: '',
          procurementMethod: undefined,
          objectUserRoles: [],
        },
  });

  const {
    trigger,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isValid, isSubmitSuccessful, errors },
    setValue,
    getValues,
  } = form;

  const { isBlocking } = useNavigationBlocker(isDirty, 'projectObjectForm');

  useEffect(() => {
    if (props.projectObject) {
      reset({
        ...props.projectObject,
        contract: props.projectObject?.contract ?? '',
        poNumber: props.projectObject?.poNumber ?? '',
        procurementMethod: props.projectObject?.procurementMethod,
      });
    }
  }, [props.projectObject]);

  useEffect(() => {
    if (newProjectObjectIds && !isBlocking) {
      navigate(
        `/${props.projectType}/${newProjectObjectIds?.projectId}/kohde/${newProjectObjectIds?.projectObjectId}`,
      );
      notify({
        severity: 'success',
        title: tr('newProjectObject.notifyUpsert'),
        duration: 5000,
      });
    }
  }, [newProjectObjectIds, isBlocking]);

  const formProjectId = watch('projectId');
  const endDateWatch = watch('endDate');

  const projectObjectUpsert = trpc.maintenanceProjectObject.upsert.useMutation({
    onSuccess: (data) => {
      if (!props.projectObject && data.projectObjectId) {
        setNewProjectObjectIds({
          projectId: data.projectId,
          projectObjectId: data.projectObjectId,
        });
        // Navigation to new project is handled in useEffect
        return;
      } else {
        queryClient.invalidateQueries({
          queryKey: [['project', 'get'], { input: { projectId: data.projectId } }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ['maintenanceProjectObject', 'get'],
            { input: { projectObjectId: data.projectObjectId } },
          ],
        });

        reset((currentData) => currentData);
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

  useEffect(() => {
    if (isSubmitSuccessful && !props.projectObject) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  useEffect(() => {
    if (!props.projectObject) {
      setDirtyAndValidViews((prev) => ({ ...prev, form: { isDirty: true, isValid: true } }));
    } else {
      setDirtyAndValidViews((prev) => ({
        ...prev,
        form: { isValid, isDirty },
      }));
    }
  }, [props.projectObject, isValid, isDirty]);

  const onSubmit = (data: UpsertMaintenanceProjectObject, geom?: string) => {
    return projectObjectUpsert.mutateAsync({ ...data, geom: geom ?? null });
  };

  function getProjectDateAlertText() {
    const errorMessage = 'projectObject.error.projectNotIncluded';

    let text = tr('projectObjectForm.infoProjectDateOutOfRange');
    if (errors.startDate?.message === errorMessage && errors.endDate?.message === errorMessage) {
      text = `${text} ${tr('projectObjectForm.infoOutOfRangeBoth')}`;
    } else if (errors.startDate?.message === errorMessage) {
      text = `${text} ${tr('projectObjectForm.infoOutOfRangeStartDate')}`;
    } else if (errors.endDate?.message === errorMessage) {
      text = `${text} ${tr('projectObjectForm.infoOutOfRangeEndDate')}`;
    }
    return text;
  }

  return (
    <>
      <FormProvider {...form}>
        {!props.projectObject && <SectionTitle title={tr('newProjectObject.title')} />}
        {props.projectObject && <SectionTitle title={tr('projectObject.formTitle')} />}
        <form id="projectObjectForm" css={newProjectFormStyle} autoComplete="off">
          <FormField
            formField="objectName"
            label={tr('projectObject.nameLabel')}
            helpTooltip={tr('projectObject.nameTooltip')}
            errorTooltip={tr('projectObject.nameErrorTooltip')}
            component={(field) => (
              <TextField
                {...readonlyProps}
                {...field}
                size="small"
                autoFocus={!props.projectObject && editing}
              />
            )}
          />

          <FormField
            formField="description"
            label={tr('projectObject.descriptionLabel')}
            helpTooltip={tr('projectObject.descriptionTooltip')}
            errorTooltip={tr('projectObject.descriptionErrorTooltip')}
            component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
          />

          <FormField
            formField="lifecycleState"
            label={tr('projectObject.lifecycleStateLabel')}
            errorTooltip={tr('projectObject.lifecycleStateTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect {...field} codeListId="KohteenElinkaarentila" readOnly={!editing} />
            )}
          />

          <FormField
            formField="objectCategory"
            label={tr('projectObject.objectCategoryLabel')}
            errorTooltip={tr('projectObject.objectCategoryTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect
                {...field}
                multiple
                codeListId="KohteenOmaisuusLuokka"
                readOnly={!editing}
              />
            )}
          />

          <FormField
            formField="objectUsage"
            label={tr('projectObject.objectUsageLabel')}
            errorTooltip={tr('projectObject.objectUsageTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect
                {...field}
                multiple
                codeListId="KohteenToiminnallinenKayttoTarkoitus"
                readOnly={!editing}
              />
            )}
          />

          <FormField
            formField="startDate"
            label={tr('projectObject.startDateLabel')}
            errorTooltip={getDateFieldErrorMessage(
              errors.startDate?.message ?? null,
              tr('projectObject.startDateTooltip'),
            )}
            component={({ onChange, ...field }) => (
              <FormDatePicker
                maxDate={dayjs(getValues('endDate')).subtract(1, 'day')}
                readOnly={!editing}
                field={{
                  onChange: (e) => {
                    onChange(e);
                    const startDate = getValues('startDate');
                    const endDate = getValues('endDate');
                    if (endDate && dayjs(startDate).isBefore(endDate)) trigger('endDate');
                  },
                  ...field,
                }}
              />
            )}
          />

          <FormField
            formField="endDate"
            label={tr('projectObject.endDateLabel')}
            errorTooltip={getDateFieldErrorMessage(
              errors.endDate?.message ?? null,
              tr('projectObject.endDateTooltip'),
              [dayjs(getValues('startDate')).add(5, 'year').year().toString()],
            )}
            component={({ onChange, ...field }) => (
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
                  minDate={dayjs(getValues('startDate')).add(1, 'day')}
                  readOnly={!editing || endDateWatch === 'infinity'}
                  field={{
                    onChange: (e) => {
                      onChange(e);
                      const startDate = getValues('startDate');
                      const endDate = getValues('endDate');
                      if (startDate && dayjs(startDate).isBefore(endDate)) trigger('startDate');
                    },
                    ...field,
                  }}
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
                      setValue('endDate', '');
                    } else {
                      onChange('infinity');
                    }
                  }}
                  checked={endDateWatch === 'infinity'}
                  label={tr('maintenanceProject.ongoing')}
                />
              </Box>
            )}
          />
          {(errors?.endDate?.message === 'projectObject.error.projectNotIncluded' ||
            errors?.startDate?.message === 'projectObject.error.projectNotIncluded') && (
            <Alert
              css={css`
                align-items: center;
              `}
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={async () => {
                    const { startDate, endDate, projectId } = getValues();
                    const formErrors = errors;
                    if (projectId) {
                      await handleProjectDateUpsert(
                        projectId,
                        formErrors?.startDate ? startDate : null,
                        formErrors?.endDate ? endDate : null,
                      );
                    }
                  }}
                >
                  {tr('projectObjectForm.updateProjectDateRangeLabel')}
                </Button>
              }
            >
              {getProjectDateAlertText()}
            </Alert>
          )}
          <FormField
            formField="contract"
            label={tr('maintenanceProjectObject.contract')}
            component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
          />
          <FormField
            formField="poNumber"
            label={tr('maintenanceProjectObject.poNumber')}
            errorTooltip="ostotilausnumero"
            component={(field) => <TextField {...readonlyProps} {...field} size="small" />}
          />
          <FormField
            formField="procurementMethod"
            label={tr('maintenanceProjectObject.procurementMethod')}
            component={({ ref, ...field }) => (
              <CodeSelect
                {...field}
                multiple={false}
                codeListId="KohteenToteutustapa"
                readOnly={!editing}
              />
            )}
          />

          <FormField
            formField="sapWBSId"
            label={tr('projectObject.sapWBSIdLabel')}
            errorTooltip={tr('projectObject.sapWBSIdTooltip')}
            component={(field) => (
              <SapWBSSelect projectId={formProjectId} readonlyProps={readonlyProps} field={field} />
            )}
          />
          <FormField
            formField="objectUserRoles"
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <ProjectObjectFormUserRoles {...field} readOnly={!editing} />
            )}
          />
          <Box
            css={css`
              display: flex;
              flex-direction: column;
            `}
          ></Box>
        </form>
      </FormProvider>
    </>
  );
});
