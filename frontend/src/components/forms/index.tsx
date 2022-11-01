import { css } from '@emotion/react';
import { Help } from '@mui/icons-material';
import { FormControl, FormLabel, TextField, Tooltip } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import { Controller, ControllerRenderProps, FieldValues, useFormContext } from 'react-hook-form';

import { useTranslations } from '@frontend/stores/lang';

interface CustomFormLabelProps {
  label: string;
  tooltip: string;
  error?: boolean;
}

function CustomFormLabel({ label, tooltip, error }: CustomFormLabelProps) {
  const [open, setOpen] = useState(true);

  return (
    <FormLabel
      error={error}
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
          title={tooltip}
        >
          <Help sx={{ color: 'red' }} onClick={() => setOpen(!open)} fontSize="small" />
        </Tooltip>
      ) : null}
    </FormLabel>
  );
}

interface FormFieldProps {
  formField: string;
  label: string;
  tooltip: string;
  component: (field: ControllerRenderProps<FieldValues, string>) => React.ReactElement;
}

export function FormField({ formField, label, tooltip, component }: FormFieldProps) {
  const { control } = useFormContext();
  return (
    <Controller
      name={formField}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl margin="dense">
          <CustomFormLabel label={label} tooltip={tooltip} error={Boolean(fieldState?.error)} />
          {component(field)}
        </FormControl>
      )}
    />
  );
}

export function FormDatePicker({ field }: { field: ControllerRenderProps<FieldValues, string> }) {
  const tr = useTranslations();
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker<Dayjs>
        inputFormat={tr['date.inputFormat']}
        value={field.value ? dayjs(field.value) : null}
        onChange={(val) => field.onChange(val?.toDate())}
        onAccept={(val) => field.onChange(val?.toDate())}
        onClose={field.onBlur}
        renderInput={(props) => {
          return <TextField {...field} {...props} size="small" />;
        }}
      />
    </LocalizationProvider>
  );
}
