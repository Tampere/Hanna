import { css } from '@emotion/react';
import { Help } from '@mui/icons-material';
import { FormControl, FormLabel, Tooltip } from '@mui/material';
import { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';
import {
  Controller,
  ControllerRenderProps,
  FieldError,
  FieldValues,
  useFormContext,
} from 'react-hook-form';

import { useTranslations } from '@frontend/stores/lang';

import { isTranslationKey } from '@shared/language';

import { DatePicker } from './DatePicker';

interface CustomFormLabelProps {
  htmlFor?: string;
  label?: string;
  tooltip?: string;
  error?: FieldError;
  required?: boolean;
}

export function CustomFormLabel({
  htmlFor,
  label,
  tooltip,
  error,
  required,
}: CustomFormLabelProps) {
  const [open, setOpen] = useState(true);
  const tr = useTranslations();

  return (
    <FormLabel
      htmlFor={htmlFor}
      error={Boolean(error)}
      css={css`
        display: flex;
        justify-content: space-between;
      `}
    >
      <span>
        {label}
        {required && <span>&nbsp;*</span>}
      </span>
      {error && (
        <Tooltip
          arrow
          placement="left-end"
          open={open}
          css={css`
            border-bottom: 2px dotted red;
            cursor: pointer;
            z-index: 400;
          `}
          title={
            error.type === 'custom' && isTranslationKey(error.message) ? tr(error.message) : tooltip
          }
        >
          <Help sx={{ color: 'red' }} onClick={() => setOpen(!open)} fontSize="small" />
        </Tooltip>
      )}
    </FormLabel>
  );
}

interface FormFieldProps<T extends object> {
  formField: keyof T;
  label?: string;
  tooltip?: string;
  required?: boolean;
  component: (
    field: ControllerRenderProps<FieldValues, string> & { id?: string },
  ) => React.ReactElement;
}

export function FormField<T extends object = any>({
  formField,
  label,
  tooltip,
  component,
}: FormFieldProps<T>) {
  const { control } = useFormContext();

  const required = useMemo(() => {
    return control._options.context?.requiredFields.has(formField) ?? false;
  }, [formField, control._options.context]);

  return (
    <Controller
      name={String(formField)}
      control={control}
      render={({ field, fieldState }) => {
        return (
          <FormControl margin="dense">
            {label && (
              <CustomFormLabel
                htmlFor={String(formField)}
                label={label}
                tooltip={tooltip}
                error={fieldState.error}
                required={required}
              />
            )}

            {component({ ...field, id: String(formField) })}
          </FormControl>
        );
      }}
    />
  );
}

interface FormDatePickerProps {
  field: ControllerRenderProps<FieldValues, string> & { id?: string };
  readOnly?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}
export function FormDatePicker({ field, readOnly, minDate, maxDate }: FormDatePickerProps) {
  return (
    <DatePicker
      id={field.id}
      name={field.name}
      value={field.value}
      onChange={(value) => field.onChange(value)}
      onClose={field.onBlur}
      readOnly={readOnly}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
