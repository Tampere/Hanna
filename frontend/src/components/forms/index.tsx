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
      {error && (
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
      )}
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

interface FormDatePickerProps {
  field: ControllerRenderProps<FieldValues, string>;
  readOnly?: boolean;
}
export function FormDatePicker({ field, readOnly }: FormDatePickerProps) {
  const tr = useTranslations();
  const readonlyProps = {
    variant: 'filled',
    hiddenLabel: true,
    InputProps: { readOnly: true },
  } as const;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DesktopDatePicker<Dayjs>
        readOnly={readOnly}
        inputFormat={tr['date.inputFormat']}
        value={field.value ? dayjs(field.value) : null}
        onChange={(val) => field.onChange(val?.toDate())}
        onAccept={(val) => field.onChange(val?.toDate())}
        onClose={field.onBlur}
        renderInput={(props) => {
          return <TextField {...(readOnly && readonlyProps)} {...field} {...props} size="small" />;
        }}
      />
    </LocalizationProvider>
  );
}
