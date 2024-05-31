import { css } from '@emotion/react';
import { Help } from '@mui/icons-material';
import { Box, FormControl, FormLabel, IconButton, Typography } from '@mui/material';
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

function FormTooltip({
  open,
  setOpen,
  text,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  text?: string;
}) {
  return (
    <Box
      css={css`
        transform: translateY(-2px);
        animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        display: flex;
        align-items: center;
      `}
    >
      {open && text && (
        <Box
          css={css`
            z-index: 400;
            animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            position: relative;
            right: 6px;
            bottom: 2px;
            border-radius: 4px;
            padding: 4px 6px;
            background-color: rgba(97, 97, 97, 0.92);
            border-color: rgba(97, 97, 97, 0.92);
            :after {
              content: '';
              position: absolute;
              top: 45%;
              right: -5px;
              width: 0;
              height: 0;
              border-top: 5px solid transparent;
              border-bottom: 5px solid transparent;
              border-left: 5px solid black;
              border-left-color: inherit;
            }
          `}
        >
          <Typography
            css={css`
              font-size: 0.65rem;
              font-weight: 500;
              color: white;
            `}
          >
            {text}
          </Typography>
        </Box>
      )}
      <IconButton
        css={css`
          height: 1em;
          width: 1em;
          border-radius: 0;
          border-bottom: 2px dotted red;
          cursor: pointer;
        `}
        onClick={() => setOpen(!open)}
      >
        <Help sx={{ color: 'red' }} fontSize="small" />
      </IconButton>
    </Box>
  );
}

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
        <FormTooltip
          open={open}
          setOpen={setOpen}
          text={
            error.type === 'custom' && isTranslationKey(error.message) ? tr(error.message) : tooltip
          }
        />
        /*  <Tooltip
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
        </Tooltip> */
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
