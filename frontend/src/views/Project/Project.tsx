import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  FormControl,
  FormLabel,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { client } from '@frontend/client';
import { FormDatePicker, FormField } from '@frontend/components/forms';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { NewProject, newProjectSchema } from '@shared/schema/project';

const newProjectFormStyle = css`
  padding: 16px;
  display: grid;
`;

function NewProjectForm() {
  const tr = useTranslations();
  const notify = useNotifications();

  const form = useForm<NewProject>({
    mode: 'onBlur',
    resolver: zodResolver(newProjectSchema),
    defaultValues: { projectName: '' },
  });

  const onSubmit = (data: NewProject) => {
    try {
      client.project.create.mutate({
        projectName: data.projectName,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      notify({
        severity: 'success',
        title: tr['newProject.notifyCreatedTitle'],
        message: tr['newProject.notifyCreatedMsg'],
        duration: 5000,
      });
    } catch (error) {
      notify({
        severity: 'error',
        title: tr['newProject.notifyCreateFailedTitle'],
        message: tr['newProject.notifyCreateFailedMsg'],
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form css={newProjectFormStyle} onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
        <FormField
          formField="projectName"
          label={tr['project.projectNameLabel']}
          tooltip={tr['newProject.projectNameTooltip']}
          component={(field) => <TextField {...field} size="small" autoFocus></TextField>}
        />

        <FormField
          formField="description"
          label={tr['project.descriptionLabel']}
          tooltip={tr['newProject.descriptionTooltip']}
          component={(field) => <TextField {...field} minRows={2} multiline />}
        />

        <FormField
          formField="startDate"
          label={tr['project.startDateLabel']}
          tooltip={tr['newProject.startDateTooltip']}
          component={(field) => <FormDatePicker field={field} />}
        />
        <FormField
          formField="endDate"
          label={tr['project.endDateLabel']}
          tooltip={tr['newProject.endDateTooltip']}
          component={(field) => <FormDatePicker field={field} />}
        />

        <FormControl margin="dense">
          <FormLabel>{tr['project.projectTypeLabel']}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr['project.lifecycleStateLabel']}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr['project.budgetLabel']}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr['project.committeeLabel']}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <FormControl margin="dense">
          <FormLabel>{tr['project.ownerLabel']}</FormLabel>
          <Select disabled size="small" fullWidth={true}></Select>
        </FormControl>

        <Button
          disabled={!form.formState.isValid}
          type="submit"
          sx={{ mt: 2 }}
          variant="contained"
          color="primary"
          size="small"
          endIcon={<AddCircle />}
        >
          {tr['newProject.createBtnLabel']}
        </Button>
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
  padding: 16px;
`;

const accordionSummaryStyle = css`
  background: #eee;
  border: 1px solid #ccc;
`;

export function Project() {
  const tr = useTranslations();
  return (
    <div css={pageStyle}>
      <Paper elevation={2} css={infobarRootStyle}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {tr['newProject.formTitle']}
        </Typography>
        <Accordion expanded={true}>
          <AccordionSummary css={accordionSummaryStyle} expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr['newProject.basicInfoSectionLabel']}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <NewProjectForm />
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr['newProject.linksSectionTitle']}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr['newProject.documentsSectionTitle']}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr['newProject.decisionsSectionTitle']}</Typography>
          </AccordionSummary>
        </Accordion>
      </Paper>

      <Paper elevation={2} css={mapContainerStyle}>
        Kartta placeholder
      </Paper>
    </div>
  );
}
