import { InputProps, TextField } from '@mui/material';
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/fi';
import { useAtomValue } from 'jotai';

import { langAtom, useTranslations } from '@frontend/stores/lang';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  onClose?: () => void;
  readOnly?: boolean;
  InputProps?: InputProps;
}

const isoDateStringFormat = 'YYYY-MM-DD';

export function DatePicker({ value, onChange, onClose, readOnly, InputProps }: Props) {
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const readonlyProps = {
    variant: 'filled',
    hiddenLabel: true,
    InputProps: { readOnly: true },
  } as const;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
      <DesktopDatePicker<Dayjs>
        readOnly={readOnly}
        /**
         * Chrome interprets unfinished date strings as valid (e.g. new Date("1") resolves to 2001-01-01) and this
         * breaks the date picker's keyboard input.
         *
         * However, when the underlying input's onChange callback is overridden, the Chrome's faulty date parsing doesn't seem to get called
         * and everything works just fine.
         */
        InputProps={{
          onChange: () => null,
          ...InputProps,
        }}
        inputFormat={tr('date.format')}
        value={dayjs(value, isoDateStringFormat)}
        onChange={(value) => onChange(value?.format(isoDateStringFormat) ?? null)}
        onAccept={(value) => onChange(value?.format(isoDateStringFormat) ?? null)}
        onClose={onClose}
        renderInput={(props) => {
          return (
            <TextField
              {...(readOnly && readonlyProps)}
              {...props}
              // Only highlight error if the value is actually invalid (i.e. ignore empty values)
              error={value != null && props.error}
              size="small"
            />
          );
        }}
      />
    </LocalizationProvider>
  );
}
