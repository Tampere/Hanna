import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Autocomplete, Box, Button, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import {
  FormDatePicker,
  FormField,
  getDateFieldErrorMessage,
  getFormValidator,
} from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyAndValidFieldsAtom, projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';
import { getRequiredFields } from '@frontend/utils/form';
import { SapWBSSelect } from '@frontend/views/ProjectObject/SapWBSSelect';

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
  const setDirtyAndValidViews = useSetAtom(dirtyAndValidFieldsAtom);
  const [newProjectObjectIds, setNewProjectObjectIds] = useState<{
    projectObjectId: string;
    projectId: string;
  } | null>(null);
  const editing = useAtomValue(projectEditingAtom);

  useImperativeHandle(
    ref,
    () => ({
      onSave: async (geom: string) => {
        await handleSubmit(async (data) => await onSubmit(data, geom))();
      },
      saveAndReturn: (navigateTo: string, geom: string) =>
        handleSubmit((data) => saveAndReturn(data, navigateTo, geom))(),
      onCancel: () => {
        reset();
      },
    }),
    [],
  );

  const projectUpsert = trpc.investmentProject.upsert.useMutation({
    onSuccess: () => {
      notify({
        severity: 'success',
        title: tr('projectObject.notifyProjectDateRangeUpdated'),
        duration: 5000,
      });
      trigger(['startDate', 'endDate']);
    },
    onError: (e) => {
      const messageArray = e.message.split('"').filter((item) => isTranslationKey(item));

      notify({
        severity: 'error',
        title: tr('projectObject.notifyProjectDateRangeUpdateError'),
        message: messageArray.map((item) => tr(item)).join('\n'),
        duration: 5000,
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
    return getFormValidator<UpsertInvestmentProjectObject>(
      schemaValidation,
      projectObject.upsertValidate.fetch,
    );
  }, []);

  const form = useForm<UpsertInvestmentProjectObject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(newInvestmentProjectObjectSchema),
      getErrors: () => form.formState.errors,
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
      reset(props.projectObject);
    }
  }, [props.projectObject]);

  useEffect(() => {
    if (!props.projectObject) {
      setDirtyAndValidViews((prev) => ({ ...prev, form: { isDirty, isValid } }));
    } else {
      setDirtyAndValidViews((prev) => ({
        ...prev,
        form: { isValid, isDirty },
      }));
    }
  }, [props.projectObject, isValid, isDirty]);

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

  const projectObjectUpsert = trpc.investmentProjectObject.upsert.useMutation({
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
            ['investmentProjectObject', 'get'],
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

  const onSubmit = (data: UpsertInvestmentProjectObject, geom?: string) => {
    return projectObjectUpsert.mutateAsync({ ...data, geom: geom ?? null });
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
            errorTooltip={tr('projectObject.nameErrorTooltip')}
            helpTooltip={tr('projectObject.nameTooltip')}
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
                      setValue('sapWBSId', null);
                    }}
                  />
                );
              }}
            />
          )}

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
              errors.startDate?.message ?? null,
              tr('projectObject.startDateTooltip'),
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
            label={tr('projectObject.endDateLabel')}
            errorTooltip={getDateFieldErrorMessage(
              errors.endDate?.message ?? null,
              tr('projectObject.endDateTooltip'),
            )}
            component={(field) => (
              <FormDatePicker
                minDate={dayjs(getValues('startDate')).add(1, 'day')}
                readOnly={!editing}
                field={field}
              />
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
              <ProjectObjectFormUserRoles {...field} readOnly={!editing} forInvestment />
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
