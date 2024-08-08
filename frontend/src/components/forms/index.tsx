import { css } from '@emotion/react';
import { FormControl, FormLabel, Typography } from '@mui/material';
import { Dayjs } from 'dayjs';
import React, { PropsWithChildren, useMemo } from 'react';
import {
  Controller,
  ControllerRenderProps,
  FieldError,
  FieldValues,
  useFormContext,
} from 'react-hook-form';

import { HelpTooltip } from '../HelpTooltip';
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
  return (
    <FormLabel
      htmlFor={htmlFor}
      error={Boolean(error)}
      css={css`
        display: flex;
        justify-content: space-between;
        margin-top: 2px;
      `}
    >
      <span>
        {label}
        {required && <span>&nbsp;*</span>}
      </span>

      {tooltip && <HelpTooltip title={tooltip} color="#b4b4b4" placement="top"></HelpTooltip>}
    </FormLabel>
  );
}

interface FormLabelWrapperProps extends PropsWithChildren {
  htmlFor?: string;
  label?: string;
  tooltip?: string;
  helpTooltip?: string;
  error?: FieldError;
  required?: boolean;
}

function FormLabelWrapper({
  htmlFor,
  label,
  tooltip,
  helpTooltip,
  error,
  required,
  children,
}: FormLabelWrapperProps) {
  return (
    <>
      {label && (
        <CustomFormLabel
          htmlFor={htmlFor}
          label={label}
          tooltip={helpTooltip}
          required={required}
        />
      )}
      {children}
      {error && (
        <Typography
          css={css`
            color: #c83e36;
            font-size: 12px;
            margin-left: 4px;
          `}
        >
          {tooltip}
        </Typography>
      )}
    </>
  );
}

interface FormFieldProps<T extends object> {
  formField: keyof T;
  label?: string;
  helpTooltip?: string;
  errorTooltip?: string;
  required?: boolean;
  component: (
    field: ControllerRenderProps<FieldValues, string> & { id?: string },
  ) => React.ReactElement;
}

export function FormField<T extends object = any>({
  formField,
  label,
  errorTooltip: tooltip,
  helpTooltip,
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
            <FormLabelWrapper
              htmlFor={String(formField)}
              label={label}
              helpTooltip={helpTooltip}
              tooltip={tooltip}
              error={fieldState.error}
              required={required}
            >
              {component({ ...field, id: String(formField) })}
            </FormLabelWrapper>
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
      onChange={(value) => {
        value === 'Invalid Date' ? field.onChange(null) : field.onChange(value);
      }}
      onClose={field.onBlur}
      readOnly={readOnly}
      minDate={minDate}
      maxDate={maxDate}
    />
  );
}
