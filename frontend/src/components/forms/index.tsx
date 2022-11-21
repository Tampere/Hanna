import { css } from '@emotion/react';
import { Help } from '@mui/icons-material';
import { FormControl, FormLabel, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import { Controller, ControllerRenderProps, FieldValues, useFormContext } from 'react-hook-form';

import { DatePicker } from './DatePicker';

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
  return (
    <DatePicker
      InputProps={{ name: field.name }}
      value={field.value}
      onChange={(value) => field.onChange(value)}
      onClose={field.onBlur}
      readOnly={readOnly}
    />
  );
}
