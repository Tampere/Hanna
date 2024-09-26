import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Autocomplete, Box, Button, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField, getDateFieldErrorMessage } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyViewsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';
import { getRequiredFields } from '@frontend/utils/form';
import { SapWBSSelect } from '@frontend/views/ProjectObject/SapWBSSelect';

import { mergeErrors } from '@shared/formerror';
import { isTranslationKey } from '@shared/language';
import { ProjectListItem } from '@shared/schema/project';
import {
  UpsertInvestmentProjectObject,
  newInvestmentProjectObjectSchema,
  upsertInvestmentProjectObjectSchema,
} from '@shared/schema/projectObject/investment';

import { ProjectObjectFormUserRoles } from './ProjectObjectFormUserRoles';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectId?: string;
  projectType: ProjectTypePath;
  projectObject?: UpsertInvestmentProjectObject | null;
  setProjectId?: (projectId: string) => void;
  userIsOwner?: boolean;
  userCanWrite?: boolean;
}

interface ProjectAutoCompleteProps {
  value: ProjectListItem;
  onChange: (value?: string) => void;
}

function ProjectAutoComplete(props: Readonly<ProjectAutoCompleteProps>) {
  const tr = useTranslations();
  const projects = trpc.investmentProject.getParticipatedProjects.useQuery();

  return (
    <Autocomplete<ProjectListItem>
      {...props}
      options={projects?.data ?? []}
      noOptionsText={tr('itemSearch.noResults')}
      size="small"
      onChange={(_e, value) => {
        props.onChange(value?.projectId);
      }}
      getOptionLabel={(option) => option.projectName}
      renderInput={(params) => <TextField {...params} />}
      loading={projects.isLoading}
    />
  );
}

export const InvestmentProjectObjectForm = forwardRef(function InvestmentProjectObjectForm(
  props: Readonly<Props>,
  ref,
) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setDirtyViews = useSetAtom(dirtyViewsAtom);
  const editing = useAtomValue(projectEditingAtom);

  useImperativeHandle(
    ref,
    () => ({
      onSave: (geom: string) => {
        form.handleSubmit((data) => onSubmit(data, geom))();
      },
      saveAndReturn: (navigateTo: string, geom: string) =>
        form.handleSubmit((data) => saveAndReturn(data, navigateTo, geom))(),
      onCancel: () => {
        form.reset();
      },
    }),
    [],
  );

  const projectUpsert = trpc.investmentProject.upsert.useMutation({
    onSuccess: () => {
      notify({ severity: 'success', title: tr('projectObject.notifyProjectDateRangeUpdated') });
      form.trigger(['startDate', 'endDate']);
    },
    onError: (e) => {
      const messageArray = e.message.split('"').filter((item) => isTranslationKey(item));

      notify({
        severity: 'error',
        title: tr('projectObject.notifyProjectDateRangeUpdateError'),
        message: messageArray.map((item) => tr(item)).join('\n'),
      });
    },
  });
  const { investmentProject } = trpc.useUtils();

  async function handleProjectDateUpsert(
    projectId: string,
    startDate?: string | null,
    endDate?: string | null,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { geom, ...projectData } = await investmentProject.get.fetch({ projectId });

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
    const schemaValidation = zodResolver(upsertInvestmentProjectObjectSchema);

    return async function formValidation(
      values: UpsertInvestmentProjectObject,
      context: object,
      options: ResolverOptions<UpsertInvestmentProjectObject>,
    ) {
      const fields = options.names ?? [];

      const isFormValidation =
        fields && (fields.includes('startDate') || fields.includes('endDate') || fields.length > 1);

      const serverErrors = isFormValidation
        ? projectObject.upsertValidate.fetch({ ...values, geom: undefined }).catch(() => null)
        : null;

      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);

      return {
        values,
        errors: mergeErrors(errors).errors,
      };
    };
  }, []);

  const form = useForm<UpsertInvestmentProjectObject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(newInvestmentProjectObjectSchema),
    },
    defaultValues: props.projectObject ?? {
      projectId: props.projectId,
      objectName: '',
      description: '',
      startDate: '',
      endDate: '',
      objectUserRoles: [],
    },
  });

  useNavigationBlocker(form.formState.isDirty, 'projectObjectForm');

  useEffect(() => {
    if (props.projectObject) {
      form.reset(props.projectObject);
    }
  }, [props.projectObject]);

  useEffect(() => {
    if (!props.projectObject) {
      setDirtyViews((prev) => ({ ...prev, form: form.formState.isValid }));
    } else {
      setDirtyViews((prev) => ({
        ...prev,
        form: form.formState.isValid && form.formState.isDirty,
      }));
    }
  }, [props.projectObject, form.formState.isValid, form.formState.isDirty]);

  const formProjectId = form.watch('projectId');

  const projectObjectUpsert = trpc.investmentProjectObject.upsert.useMutation({
    onSuccess: (data) => {
      if (!props.projectObject && data.projectObjectId) {
        navigate(`/${props.projectType}/${data.projectId}/kohde/${data.projectObjectId}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['project', 'get'], { input: { projectId: data.projectId } }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ['investmentProjectObject', 'get'],
            { input: { projectObjectId: data.projectObjectId } },
          ],
        });

        form.reset((currentData) => currentData);
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
    if (form.formState.isSubmitSuccessful && !props.projectObject) {
      form.reset();
    }
  }, [form.formState.isSubmitSuccessful, form.reset]);

  const onSubmit = (data: UpsertInvestmentProjectObject, geom?: string) => {
    projectObjectUpsert.mutate({ ...data, geom: geom ?? null });
  };

  function saveAndReturn(data: UpsertInvestmentProjectObject, navigateTo: string, geom?: string) {
    projectObjectUpsert.mutate(
      { ...data, geom: geom ?? null },
      {
        onSuccess: (data) => {
          navigate(`${navigateTo}?highlight=${data.projectObjectId}`);
        },
      },
    );
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
            errorTooltip={tr('projectObject.nameErrorTooltip')}
            helpTooltip={tr('projectObject.nameTooltip')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
            )}
          />

          <FormField
            formField="description"
            label={tr('projectObject.descriptionLabel')}
            errorTooltip={tr('projectObject.descriptionErrorTooltip')}
            helpTooltip={tr('projectObject.descriptionTooltip')}
            component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
          />

          {!props.projectId && (
            <FormField
              formField="projectId"
              label={tr('projectObject.projectLabel')}
              errorTooltip={tr('projectObject.projectTooltip')}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              component={({ ref, ...field }) => {
                return (
                  <ProjectAutoComplete
                    {...readonlyProps}
                    {...field}
                    onChange={(value) => {
                      props.setProjectId?.(value ?? '');
                      field.onChange(value);
                      form.setValue('sapWBSId', null);
                    }}
                  />
                );
              }}
            />
          )}

          <FormField
            formField="suunnitteluttajaUser"
            label={tr('projectObject.suunnitteluttajaUserLabel')}
            errorTooltip={tr('projectObject.suunnitteluttajaUserTooltip')}
            component={({ id, onChange, value }) => (
              <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
            )}
          />

          <FormField
            formField="rakennuttajaUser"
            label={tr('projectObject.rakennuttajaUserLabel')}
            errorTooltip={tr('projectObject.rakennuttajaUserTooltip')}
            component={({ id, onChange, value }) => (
              <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
            )}
          />
          <FormField
            formField="objectStage"
            label={tr('projectObject.objectStageLabel')}
            errorTooltip={tr('projectObject.objectStageTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect {...field} codeListId="KohteenLaji" readOnly={!editing} />
            )}
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
            formField="objectType"
            label={tr('projectObject.objectTypeLabel')}
            errorTooltip={tr('projectObject.objectTypeTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect
                {...field}
                multiple
                codeListId="KohdeTyyppi"
                readOnly={!editing}
                maxTags={3}
              />
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
              form.formState.errors.startDate?.message ?? null,
              tr('projectObject.startDateTooltip'),
            )}
            component={({ onChange, ...field }) => (
              <FormDatePicker
                maxDate={dayjs(form.getValues('endDate')).subtract(1, 'day')}
                readOnly={!editing}
                field={{
                  onChange: (e) => {
                    onChange(e);
                    const startDate = form.getValues('startDate');
                    const endDate = form.getValues('endDate');
                    if (endDate && dayjs(startDate).isBefore(endDate)) form.trigger('endDate');
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
              form.formState.errors.endDate?.message ?? null,
              tr('projectObject.endDateTooltip'),
            )}
            component={({ onChange, ...field }) => (
              <FormDatePicker
                minDate={dayjs(form.getValues('startDate')).add(1, 'day')}
                readOnly={!editing}
                field={{
                  onChange: (e) => {
                    onChange(e);
                    const startDate = form.getValues('startDate');
                    const endDate = form.getValues('endDate');
                    if (startDate && dayjs(startDate).isBefore(endDate)) form.trigger('startDate');
                  },
                  ...field,
                }}
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
          >
            {(form.formState.errors?.endDate?.message ===
              'projectObject.error.projectNotIncluded' ||
              form.formState.errors?.startDate?.message ===
                'projectObject.error.projectNotIncluded') && (
              <Alert
                css={css`
                  margin-top: 1rem;
                  align-items: center;
                `}
                severity="warning"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={async () => {
                      const { startDate, endDate, projectId } = form.getValues();
                      const formErrors = form.formState.errors;
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
                {tr('projectObjectForm.infoProjectDateOutOfRange')}
              </Alert>
            )}
          </Box>
        </form>
      </FormProvider>
    </>
  );
});
