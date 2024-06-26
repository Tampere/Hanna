import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, ArrowDropDown, ArrowDropUp, Edit, Save, Undo } from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  ButtonGroupTypeMap,
  Popover,
  TextField,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, ResolverOptions, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { ProjectTypePath } from '@frontend/types';
import { getRequiredFields } from '@frontend/utils/form';
import { SapWBSSelect } from '@frontend/views/ProjectObject/SapWBSSelect';

import { mergeErrors } from '@shared/formerror';
import { ProjectListItem } from '@shared/schema/project';
import {
  UpsertProjectObject,
  newProjectObjectSchema,
  upsertProjectObjectSchema,
} from '@shared/schema/projectObject';

import { ProjectObjectFormUserRoles } from './ProjectObjectFormUserRoles';

const newProjectFormStyle = css`
  display: grid;
  margin-top: 16px;
`;

interface Props {
  projectId?: string;
  projectType: ProjectTypePath;
  projectObject?: UpsertProjectObject | null;
  geom?: string | null;
  setProjectId?: (projectId: string) => void;
  navigateTo?: string | null;
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

function SaveOptionsButton(
  props: Readonly<{
    form: ReturnType<typeof useForm<UpsertProjectObject>>;
    onSubmit: (data: UpsertProjectObject) => void;
  }>,
) {
  const tr = useTranslations();
  const { form, onSubmit } = props;

  const popperRef = useRef<
    React.ElementRef<ButtonGroupTypeMap['defaultComponent']> & {
      clientWidth: number;
    }
  >(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ButtonGroup
      disabled={!form.formState.isValid}
      size="small"
      color="primary"
      variant="contained"
      aria-label="outlined button group"
      ref={popperRef}
    >
      <Button
        onClick={async () => {
          const valid = await form.trigger();
          if (valid) {
            const data = form.getValues();
            form.reset(); // reset to set navigation blocker to non-blocking state
            onSubmit(data);
          }
        }}
      >
        {tr('projectObjectForm.createAndReturnBtnLabel')}
      </Button>
      <Button onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <ArrowDropUp /> : <ArrowDropDown />}
        <Popover
          open={menuOpen}
          anchorEl={popperRef.current}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          onClose={() => setMenuOpen(false)}
        >
          <Button
            /* NOTE: Popover component creates a new React root, which means that the submit button
            is not part of the form in the React component tree, even though it might look like it
            in the DOM.*/
            form="projectObjectForm"
            type="submit"
            variant="text"
            style={{ width: popperRef.current?.clientWidth }}
          >
            {tr('projectObjectForm.saveBtnLabel')}
          </Button>
        </Popover>
      </Button>
    </ButtonGroup>
  );
}

export function ProjectObjectForm(props: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.projectObject);

  const projectUpsert = trpc.investmentProject.upsert.useMutation({
    onSuccess: () => {
      notify({ severity: 'success', title: tr('projectObject.notifyProjectDateRangeUpdated') });
      form.trigger(['startDate', 'endDate']);
    },
    onError: () => {
      notify({ severity: 'error', title: tr('projectObject.notifyProjectDateRangeUpdateError') });
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
    const schemaValidation = zodResolver(upsertProjectObjectSchema);

    return async function formValidation(
      values: UpsertProjectObject,
      context: object,
      options: ResolverOptions<UpsertProjectObject>,
    ) {
      const fields = options.names ?? [];

      const isFormValidation =
        fields && (fields.includes('startDate') || fields.includes('endDate') || fields.length > 1);

      const serverErrors = isFormValidation
        ? projectObject.upsertValidate.fetch(values).catch(() => null)
        : null;

      const shapeErrors = schemaValidation(values, context, options);
      const errors = await Promise.all([serverErrors, shapeErrors]);

      return {
        values,
        errors: mergeErrors(errors).errors,
      };
    };
  }, []);

  const form = useForm<UpsertProjectObject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(newProjectObjectSchema),
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

  const formProjectId = form.watch('projectId');

  const projectObjectUpsert = trpc.projectObject.upsert.useMutation({
    onSuccess: (data) => {
      if (!props.projectObject && data.projectObjectId) {
        navigate(`/${props.projectType}/${data.projectId}/kohde/${data.projectObjectId}`);
      } else {
        queryClient.invalidateQueries({
          queryKey: [['project', 'get'], { input: { projectId: data.projectId } }],
        });
        queryClient.invalidateQueries({
          queryKey: [
            ['projectObject', 'get'],
            { input: { projectObjectId: data.projectObjectId } },
          ],
        });

        setEditing(false);
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

  const onSubmit = (data: UpsertProjectObject) => {
    projectObjectUpsert.mutate({ ...data, geom: props.geom });
  };

  const saveAndReturn = (data: UpsertProjectObject) => {
    projectObjectUpsert.mutate(
      { ...data, geom: props.geom },
      {
        onSuccess: (data) => {
          navigate(`${props.navigateTo}?highlight=${data.projectObjectId}`);
        },
      },
    );
  };

  return (
    <>
      <FormProvider {...form}>
        {!props.projectObject && <SectionTitle title={tr('newProjectObject.title')} />}
        {props.projectObject && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <SectionTitle title={tr('projectObject.formTitle')} />
            {!editing ? (
              <Button
                variant="contained"
                disabled={!props.userIsOwner && !props.userCanWrite}
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
        <form
          id="projectObjectForm"
          css={newProjectFormStyle}
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off"
        >
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

          {!props.projectId && (
            <FormField
              formField="projectId"
              label={tr('projectObject.projectLabel')}
              tooltip={tr('projectObject.projectTooltip')}
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
            tooltip={tr('projectObject.suunnitteluttajaUserTooltip')}
            component={({ id, onChange, value }) => (
              <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
            )}
          />

          <FormField
            formField="rakennuttajaUser"
            label={tr('projectObject.rakennuttajaUserLabel')}
            tooltip={tr('projectObject.rakennuttajaUserTooltip')}
            component={({ id, onChange, value }) => (
              <UserSelect id={id} value={value} onChange={onChange} readOnly={!editing} />
            )}
          />
          <FormField
            formField="objectStage"
            label={tr('projectObject.objectStageLabel')}
            tooltip={tr('projectObject.objectStageTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect {...field} codeListId="KohteenLaji" readOnly={!editing} />
            )}
          />

          <FormField
            formField="lifecycleState"
            label={tr('projectObject.lifecycleStateLabel')}
            tooltip={tr('projectObject.lifecycleStateTooltip')}
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            component={({ ref, ...field }) => (
              <CodeSelect {...field} codeListId="KohteenElinkaarentila" readOnly={!editing} />
            )}
          />

          <FormField
            formField="objectType"
            label={tr('projectObject.objectTypeLabel')}
            tooltip={tr('projectObject.objectTypeTooltip')}
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
            tooltip={tr('projectObject.objectCategoryTooltip')}
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
            tooltip={tr('projectObject.objectUsageTooltip')}
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
            tooltip={tr('projectObject.startDateTooltip')}
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
            tooltip={tr('projectObject.endDateTooltip')}
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
            tooltip={tr('projectObject.sapWBSIdTooltip')}
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
            {!props.projectObject && (!props.geom || props.geom === '[]') && (
              <Alert sx={{ mt: 1 }} severity="info">
                {tr('projectObjectForm.infoNoGeom')}
              </Alert>
            )}

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

          {!props.projectObject && props.navigateTo && (
            <div
              css={css`
                margin-top: 16px;
                display: flex;
                justify-content: space-between;
              `}
            >
              <Button component={Link} to={props.navigateTo} variant="outlined">
                {tr('cancel')}
              </Button>

              <SaveOptionsButton form={form} onSubmit={saveAndReturn} />
            </div>
          )}

          {!props.projectObject && !props.navigateTo && (
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
    </>
  );
}
