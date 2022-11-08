import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, Edit, ExpandMore, Save, Undo } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLoaderData, useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { DbProject, UpsertProject, upsertProjectSchema } from '@shared/schema/project';

const newProjectFormStyle = css`
  padding: 0px 16px 16px 16px;
  display: grid;
`;

interface ProjectFormProps {
  project?: DbProject | null;
}

function ProjectForm(props: ProjectFormProps) {
  const tr = useTranslations();
  const notify = useNotifications();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!props.project);

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

  const form = useForm<UpsertProject>({
    mode: 'all',
    resolver: zodResolver(upsertProjectSchema),
    defaultValues: props.project ?? { projectName: '' },
  });

  const projectUpsert = trpc.project.upsert.useMutation({
    onSuccess: (data) => {
      // Navigate to new url if we are creating a new project
      if (!props.project && data.id) {
        navigate(`/hanke/${data.id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: [['project', 'get'], { id: data.id }] });
        setEditing(false);
        form.reset(data);
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

  const onSubmit = (data: UpsertProject | DbProject) => projectUpsert.mutate(data);

  return (
    <FormProvider {...form}>
      {props.project && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        <FormField
          formField="projectName"
          label={tr('project.projectNameLabel')}
          tooltip={tr('newProject.projectNameTooltip')}
          component={(field) => (
            <TextField {...readonlyProps} {...field} size="small" autoFocus={editing} />
          )}
        />

        <FormField
          formField="description"
          label={tr('project.descriptionLabel')}
          tooltip={tr('newProject.descriptionTooltip')}
          component={(field) => <TextField {...readonlyProps} {...field} minRows={2} multiline />}
        />

        <FormField
          formField="startDate"
          label={tr('project.startDateLabel')}
          tooltip={tr('newProject.startDateTooltip')}
          component={(field) => <FormDatePicker readOnly={!editing} field={field} />}
        />
        <FormField
          formField="endDate"
          label={tr('project.endDateLabel')}
          tooltip={tr('newProject.endDateTooltip')}
          component={(field) => <FormDatePicker readOnly={!editing} field={field} />}
        />

        {/*
        <FormControl margin="dense">
          <FormLabel>{tr('project.projectTypeLabel')}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr('project.lifecycleStateLabel')}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr('project.budgetLabel')}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr('project.committeeLabel')}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr('project.ownerLabel')}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>
      */}

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
            disabled={!form.formState.isValid || !form.formState.isDirty}
            endIcon={<Save />}
          >
            {tr('projectForm.saveBtnLabel')}
          </Button>
        )}
      </form>
    </FormProvider>
  );
}

const pageStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
`;

const infobarRootStyle = css`
  padding: 16px;
`;

const mapContainerStyle = css`
  min-height: 600px;
`;

const accordionSummaryStyle = css`
  background: #eee;
  border: 1px solid #ccc;
`;

export function Project() {
  const tr = useTranslations();
  const routeParams = useLoaderData() as { projectId: string };
  const projectId = routeParams?.projectId;
  const project = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId), queryKey: ['project.get', { id: projectId }] }
  );

  if (projectId && !project.data) {
    return <Typography>{tr('loading')}</Typography>;
  }

  return (
    <div css={pageStyle}>
      <Paper elevation={2} css={infobarRootStyle}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {project?.data?.projectName ?? tr('newProject.formTitle')}
        </Typography>
        <Accordion expanded={true}>
          <AccordionSummary css={accordionSummaryStyle} expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.basicInfoSectionLabel')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ProjectForm project={project.data} />
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.linksSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.documentsSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.decisionsSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>
      </Paper>

      <Paper elevation={2} css={mapContainerStyle}>
        <MapWrapper />
      </Paper>
    </div>
  );
}
