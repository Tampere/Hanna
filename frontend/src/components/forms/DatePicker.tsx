import { TextField, TextFieldProps } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fiFI } from '@mui/x-date-pickers/locales';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fi';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';

import { langAtom, useTranslations } from '@frontend/stores/lang';

interface Props {
  id?: string;
  name?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  onClose?: () => void;
  readOnly?: boolean;
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

const isoDateStringFormat = 'YYYY-MM-DD';

function CustomTextField(props: TextFieldProps & { name?: string; onClick?: () => void }) {
  return (
    <TextField
      {...props}
      // Only highlight error if the value is actually invalid (i.e. ignore empty values)
      error={props.value != '' && props.value != null && props.error}
      size="small"
      InputProps={{
        ...props.InputProps,
        name: props.name,
      }}
      // TODO temporarily disabled keyboard input because of https://github.com/mui/mui-x/issues/8485
      inputProps={{ ...props.inputProps, readOnly: true }}
      onClick={props.onClick}
    />
  );
}

export function DatePicker(props: Props) {
  const { id, name, value, onChange, onClose, readOnly, minDate, maxDate } = props;
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const readonlyProps = {
    variant: 'filled',
    hiddenLabel: true,
    InputProps: { readOnly: true },
  } as const;

  // TODO "open" state is controlled here only because it is opened on click as a workaround to the MUI bug
  const [open, setOpen] = useState(false);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={lang}
      localeText={{
        ...fiFI.components.MuiLocalizationProvider.defaultProps.localeText,
        // Add missing localizations for field placeholders
        fieldDayPlaceholder: () => tr('date.dayPlaceholder'),
        fieldMonthPlaceholder: () => tr('date.monthPlaceholder'),
        fieldYearPlaceholder: () => tr('date.yearPlaceholder'),
      }}
    >
      <DesktopDatePicker<Dayjs>
        readOnly={readOnly}
        minDate={minDate}
        maxDate={maxDate}
        format={tr('date.format')}
        value={!value ? null : dayjs(value, isoDateStringFormat)}
        onChange={(value) => onChange(value?.format(isoDateStringFormat) ?? null)}
        onAccept={(value) => onChange(value?.format(isoDateStringFormat) ?? null)}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        slots={{ textField: CustomTextField as any }}
        slotProps={
          {
            textField: {
              ...(readOnly && readonlyProps),
              name,
              inputProps: {
                placeholder: tr('date.format.placeholder'),
                id,
              },
              onClick: () => {
                setOpen(true);
              },
            },
          } as any
        }
      />
    </LocalizationProvider>
  );
}
