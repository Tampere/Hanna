import { css } from '@emotion/react';
import { Help } from '@mui/icons-material';
import { FormControl, FormLabel, Tooltip } from '@mui/material';
import { Dayjs } from 'dayjs';
import React, { useState } from 'react';
import {
  Controller,
  ControllerRenderProps,
  FieldError,
  FieldValues,
  useFormContext,
} from 'react-hook-form';

import { DatePicker } from './DatePicker';

interface CustomFormLabelProps {
  label?: string;
  tooltip?: string;
  error?: FieldError;
}

export function CustomFormLabel({ label, tooltip, error }: CustomFormLabelProps) {
  const [open, setOpen] = useState(true);

  return (
    <FormLabel
      error={Boolean(error)}
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
          title={error.type === 'custom' ? error.message : tooltip}
        >
          <Help sx={{ color: 'red' }} onClick={() => setOpen(!open)} fontSize="small" />
        </Tooltip>
      )}
    </FormLabel>
  );
}

interface FormFieldProps {
  formField: string;
  label?: string;
  tooltip?: string;
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
          <CustomFormLabel label={label} tooltip={tooltip} error={fieldState.error} />
          {component(field)}
        </FormControl>
      )}
    />
  );
}

interface FormDatePickerProps {
  field: ControllerRenderProps<FieldValues, string>;
  readOnly?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}
export function FormDatePicker({ field, readOnly, minDate, maxDate }: FormDatePickerProps) {
  return (
    <DatePicker
      InputProps={{ name: field.name }}
      value={field.value}
      onChange={(value) => field.onChange(value)}
      onClose={field.onBlur}
      readOnly={readOnly}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
