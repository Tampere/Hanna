import { Backspace } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';
import { DesktopDatePickerProps, MobileDatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

interface YearMonthPickerProps {
  dateMode: 'startOfMonth' | 'endOfMonth';
  value: string | null;
  onChange: (value: string | null) => void;
  DatePickerProps?: DesktopDatePickerProps<Dayjs>;
  format?: string;
  readOnly?: boolean;
}

/**
 * YearMonthPicker component props
 * @property {'startOfMonth' | 'endOfMonth'} dateMode - The mode of the date
 * @property {string | null} value - The current selected value
 * @property {(value: string | null) => void} onChange - Handler for change events
 * @property {DesktopDatePickerProps<Dayjs>} DatePickerProps - The DatePicker properties
 * @property {string} format - The format of the date
 * @property {boolean} readOnly - If true, the DatePicker is read-only
 */

export function YearMonthPicker({
  dateMode,
  value,
  onChange,
  DatePickerProps,
  readOnly = false,
  format = 'YYYY-MM-DD',
}: YearMonthPickerProps) {
  const tr = useTranslations();

  const [view, setView] = useState<'year' | 'month'>('year');

  return (
    <MobileDatePicker
      value={value ? dayjs(value) : null}
      view={view}
      onYearChange={() => setView('month')}
      views={['year', 'month']}
      format={'MM/YYYY'}
      disabled={readOnly}
      // hide the huge default toolbar
      slots={{ toolbar: () => <span /> }}
      slotProps={{
        textField: {
          fullWidth: true,
          size: 'small',
          type: 'text',
          disabled: readOnly,
          variant: readOnly ? 'filled' : 'outlined',
          hiddenLabel: readOnly,
          inputProps: {
            placeholder: tr('date.format.yearmonth.placeholder'),
          },
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null);
                  }}
                >
                  <Backspace />
                </IconButton>
              </InputAdornment>
            ),
          },
        },
      }}
      onAccept={(date) => {
        if (date === null) {
          onChange(null);
          return;
        }
        let resultDate;
        switch (dateMode) {
          case 'startOfMonth':
            resultDate = date.startOf('month').format(format);
            break;
          case 'endOfMonth':
            resultDate = date.endOf('month').format(format);
            break;
        }
        onChange(resultDate);
      }}
      {...DatePickerProps}
    />
  );
}
