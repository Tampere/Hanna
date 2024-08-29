import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, ArrowDropDown, ArrowDropUp, Edit, Save, Undo } from '@mui/icons-material';
import {
  Alert,
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
import { isTranslationKey } from 'tre-hanna-shared/src/language';

import { trpc } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { ProjectTypePath } from '@frontend/types';
import { getRequiredFields } from '@frontend/utils/form';
import { SapWBSSelect } from '@frontend/views/ProjectObject/SapWBSSelect';

import { mergeErrors } from '@shared/formerror';
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
  projectId?: string;
  projectType: ProjectTypePath;
  projectObject?: UpsertMaintenanceProjectObject | null;
  geom?: string | null;
  setProjectId?: (projectId: string) => void;
  navigateTo?: string | null;
  userIsOwner?: boolean;
  userCanWrite?: boolean;
}

function SaveOptionsButton(
  props: Readonly<{
    form: ReturnType<typeof useForm<UpsertMaintenanceProjectObject>>;
    onSubmit: (data: UpsertMaintenanceProjectObject) => void;
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

export function MaintenanceProjectObjectForm(props: Readonly<Props>) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.projectObject);

  const projectUpsert = trpc.maintenanceProject.upsert.useMutation({
    onSuccess: () => {
      notify({ severity: 'success', title: tr('projectObject.notifyProjectDateRangeUpdated') });
      form.trigger(['startDate', 'endDate']);
    },
    onError: () => {
      notify({ severity: 'error', title: tr('projectObject.notifyProjectDateRangeUpdateError') });
    },
  });
  const { maintenanceProject } = trpc.useUtils();

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
      context: object,
      options: ResolverOptions<UpsertMaintenanceProjectObject>,
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

  const form = useForm<UpsertMaintenanceProjectObject>({
    mode: 'all',
    resolver: formValidator,
    context: {
      requiredFields: getRequiredFields(newMaintenanceProjectObjectSchema),
    },
    defaultValues: props.projectObject
      ? {
          ...props.projectObject,
          contract: props.projectObject?.contract ?? '',
          poNumber: props.projectObject?.poNumber ?? '',
          procurementMethod: props.projectObject?.procurementMethod ?? '',
        }
      : {
          projectId: props.projectId,
          objectName: '',
          description: '',
          startDate: '',
          endDate: '',
          contract: '',
          poNumber: '',
          procurementMethod: '',
          objectUserRoles: [],
        },
  });

  useNavigationBlocker(form.formState.isDirty, 'projectObjectForm');

  useEffect(() => {
    if (props.projectObject) {
      form.reset({
        ...props.projectObject,
        contract: props.projectObject?.contract ?? '',
        poNumber: props.projectObject?.poNumber ?? '',
        procurementMethod: props.projectObject?.procurementMethod ?? '',
      });
    }
  }, [props.projectObject]);

  const formProjectId = form.watch('projectId');

  const projectObjectUpsert = trpc.maintenanceProjectObject.upsert.useMutation({
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

  const onSubmit = (data: UpsertMaintenanceProjectObject) => {
    projectObjectUpsert.mutate({ ...data, geom: props.geom });
  };

  const saveAndReturn = (data: UpsertMaintenanceProjectObject) => {
    projectObjectUpsert.mutate(
      { ...data, geom: props.geom },
      {
        onSuccess: (data) => {
          navigate(`${props.navigateTo}?highlight=${data.projectObjectId}`);
        },
      },
    );
  };

  function getDateFieldErrorMessage(hookFormMessage: string | null, fallBackMessage: string) {
    if (hookFormMessage && isTranslationKey(hookFormMessage)) {
      return tr(hookFormMessage);
    }
    return fallBackMessage;
  }

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
            helpTooltip={tr('projectObject.nameTooltip')}
            errorTooltip={tr('projectObject.nameErrorTooltip')}
            component={(field) => (
              <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
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
