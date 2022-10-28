import { css } from '@emotion/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddCircle, ExpandMore, Help } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  FormLabel,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { Controller, FieldError, useForm } from 'react-hook-form';

import { client } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { NewProject, newProjectSchema } from '@shared/schema/project';

// Component styles

const pageStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
`;

const infobarRootStyle = css`
  padding: 16px;
`;

const newProjectFormStyle = css`
  padding: 16px;
  display: grid;
`;

const mapContainerStyle = css`
  padding: 16px;
`;

const accordionSummaryStyle = css`
  background: #eee;
  border: 1px solid #ccc;
`;

interface CustomFormLabelProps {
  label: string;
  errorTooltip: string;
  error?: FieldError;
}

function CustomFormLabel({ label, errorTooltip, error }: CustomFormLabelProps) {
  const [open, setOpen] = useState(true);

  return (
    <FormLabel
      css={css`
        display: flex;
        justify-content: space-between;
      `}
    >
      {label}
      {error ? (
        <Tooltip
          arrow
          placement="left-end"
          open={open}
          css={css`
            border-bottom: 2px dotted red;
            cursor: pointer;
          `}
          title={errorTooltip}
        >
          <Help sx={{ color: 'red' }} onClick={() => setOpen(!open)} fontSize="small" />
        </Tooltip>
      ) : null}
    </FormLabel>
  );
}

function NewProjectForm() {
  const tr = useTranslations();

  const {
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<NewProject>({
    mode: 'onBlur',
    resolver: zodResolver(newProjectSchema),
    defaultValues: { projectName: '' },
  });

  const onSubmit = (data: NewProject) => {
    client.project.create.mutate({
      projectName: data.projectName,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  };

  return (
    <form css={newProjectFormStyle} onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Controller
        name="projectName"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl margin="dense">
            <CustomFormLabel
              label={tr['project.projectNameLabel']}
              errorTooltip={tr['newProject.projectNameTooltip']}
              error={fieldState.error}
            />
            <TextField
              {...field}
              error={Boolean(fieldState.error)}
              size="small"
              fullWidth={true}
              autoFocus
            />
          </FormControl>
        )}
      />
      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <FormControl margin="dense">
            <CustomFormLabel
              label={tr['project.descriptionLabel']}
              errorTooltip={tr['newProject.descriptionTooltip']}
              error={fieldState.error}
            />
            <TextField
              {...field}
              error={Boolean(fieldState.error)}
              minRows={2}
              maxRows={6}
              multiline={true}
            />
          </FormControl>
        )}
      />
      <FormControl margin="dense">
        <FormLabel>{tr['project.projectTypeLabel']}</FormLabel>
        <Select size="small" fullWidth={true}></Select>
      </FormControl>
      <FormControl margin="dense">
        <FormLabel>{tr['project.lifecycleStateLabel']}</FormLabel>
        <Select size="small" fullWidth={true}></Select>
      </FormControl>
      <FormControl margin="dense">
        <FormLabel>{tr['project.budgetLabel']}</FormLabel>
        <Select size="small" fullWidth={true}></Select>
      </FormControl>
      <FormControl margin="dense">
        <FormLabel>{tr['project.lautakuntaLabel']}</FormLabel>
        <Select size="small" fullWidth={true}></Select>
      </FormControl>
      <FormControl margin="dense">
        <FormLabel>{tr['project.ownerLabel']}</FormLabel>
        <Select size="small" fullWidth={true}></Select>
      </FormControl>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Controller
          name="startDate"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl margin="dense">
              <CustomFormLabel
                label={tr['project.startDateLabel']}
                errorTooltip={tr['newProject.startDateTooltip']}
                error={fieldState.error}
              />
              <DesktopDatePicker<Dayjs>
                inputFormat={tr['date.inputFormat']}
                value={field.value ? dayjs(field.value) : null}
                onChange={(val) => field.onChange(val?.toDate())}
                onAccept={(val) => field.onChange(val?.toDate())}
                onClose={field.onBlur}
                renderInput={(props) => {
                  return (
                    <TextField
                      {...field}
                      {...props}
                      size="small"
                      error={Boolean(fieldState.error)}
                    />
                  );
                }}
              />
            </FormControl>
          )}
        />
        <Controller
          name="endDate"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl margin="dense">
              <CustomFormLabel
                label={tr['project.endDateLabel']}
                errorTooltip={tr['newProject.endDateTooltip']}
                error={fieldState.error}
              />
              <DesktopDatePicker<Dayjs>
                inputFormat={tr['date.inputFormat']}
                value={field.value ? dayjs(field.value) : null}
                onChange={(val) => field.onChange(val?.toDate())}
                onAccept={(val) => field.onChange(val?.toDate())}
                onClose={field.onBlur}
                renderInput={(props) => {
                  return (
                    <TextField
                      {...field}
                      {...props}
                      size="small"
                      error={Boolean(fieldState.error)}
                    />
                  );
                }}
              />
            </FormControl>
          )}
        />
      </LocalizationProvider>

      <Box>
        <Button
          disabled={!isValid}
          type="submit"
          sx={{ mt: 2 }}
          variant="contained"
          color="primary"
          size="small"
          endIcon={<AddCircle />}
        >
          {tr['newProject.createBtnLabel']}
        </Button>
      </Box>
    </form>
  );
}

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
