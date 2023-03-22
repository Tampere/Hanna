import { css } from '@emotion/react';
import { CalendarMonthTwoTone } from '@mui/icons-material';
import { Box, Chip, IconButton, Popover, TextField, Typography } from '@mui/material';
import {
  DateCalendar,
  LocalizationProvider,
  PickersDay,
  PickersDayProps,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

import { langAtom, useTranslations } from '@frontend/stores/lang';

const isoFormat = 'YYYY-MM-DD';

interface Period {
  startDate: string;
  endDate: string;
}

interface QuickSelection {
  label: string;
  period: Period;
}

interface Props {
  value: Period;
  onChange: (value: Period) => void;
  onClear?: () => void;
  quickSelections?: readonly QuickSelection[];
  clearable?: boolean;
  readOnly?: boolean;
}

function widgetDayCSSProps(day: Dayjs, selectedDate: Dayjs, inRange: boolean) {
  if (day.isSame(selectedDate, 'day')) {
    return {
      css: css`
        border-radius: 0px;
      `,
    };
  } else if (inRange) {
    return {
      css: css`
        border-radius: 0px;
        background: #d1e4ed;
      `,
    };
  }
}

type CustomDayProps = PickersDayProps<Dayjs> & {
  selectedDay: Dayjs;
  inRange: (day: Dayjs) => boolean;
  dateFormat: string;
};

function CustomDay(props: CustomDayProps) {
  const { selectedDay, inRange, dateFormat, ...pickersDayProps } = props;
  return (
    <PickersDay
      aria-label={`${pickersDayProps.day.format(dateFormat)}`}
      disableMargin
      {...widgetDayCSSProps(selectedDay, pickersDayProps.day, inRange(pickersDayProps.day))}
      {...pickersDayProps}
    />
  );
}

export function DateRange(props: Props) {
  const [startDate, setStartDate] = useState<Dayjs>(dayjs(props.value.startDate));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs(props.value.endDate));

  const [open, setOpen] = useState(false);
  const [startPickerView, setStartPickerView] = useState<'day' | 'month' | 'year'>('day');
  const [endPickerView, setEndPickerView] = useState<'day' | 'month' | 'year'>('day');

  const lang = useAtomValue(langAtom);
  const tr = useTranslations();
  const dateFormat = tr('date.format');
  const startInput = useRef(null);

  const commonProps = {
    disableHighlightToday: true,
    reduceAnimations: true,
  };

  useEffect(
    function validateDateRange() {
      if (startDate < endDate) {
        props.onChange({
          startDate: startDate.format(isoFormat),
          endDate: endDate.format(isoFormat),
        });
      }
    },
    [startDate, endDate]
  );

  function handleQuickSelection(selection: QuickSelection) {
    setStartDate(dayjs(selection.period.startDate));
    setEndDate(dayjs(selection.period.endDate));
    setOpen(false);
  }

  return (
    <div>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <TextField
          name="startDate"
          hiddenLabel={props.readOnly}
          variant={props.readOnly ? 'filled' : 'outlined'}
          inputProps={{ readOnly: true }}
          ref={startInput}
          value={dayjs(props.value.startDate).format(dateFormat)}
          size="small"
          onClick={() => setOpen(true)}
          placeholder={tr('date.format.placeholder')}
        />
        <span>—</span>
        <TextField
          name="endDate"
          hiddenLabel={props.readOnly}
          variant={props.readOnly ? 'filled' : 'outlined'}
          inputProps={{ readOnly: props.readOnly }}
          value={dayjs(props.value.endDate).format(dateFormat)}
          size="small"
          onClick={() => setOpen(true)}
          placeholder={tr('date.format.placeholder')}
        />
        <IconButton
          aria-label="open-calendar"
          onClick={() => setOpen(true)}
          disabled={props.readOnly}
        >
          <CalendarMonthTwoTone />
        </IconButton>
      </Box>
      <Popover
        anchorEl={startInput.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        open={open}
        onClose={() => setOpen(false)}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            {props.quickSelections && (
              <Box
                css={css`
                  padding: 16px;
                `}
              >
                <Typography variant="overline">{tr('dateRange.quickSelections')}</Typography>
                <Box
                  css={css`
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                  `}
                >
                  {props.quickSelections.map((selection, idx) => (
                    <Chip
                      key={idx}
                      css={css`
                        margin: 4px 0px;
                        width: 100%;
                      `}
                      color="primary"
                      variant="outlined"
                      onClick={() => handleQuickSelection(selection)}
                      label={selection.label}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <DateCalendar
              {...commonProps}
              view={startPickerView}
              onYearChange={() => setStartPickerView('month')}
              onMonthChange={() => setStartPickerView('day')}
              onViewChange={(newView) => setStartPickerView(newView)}
              slots={{ day: CustomDay as any }}
              slotProps={{
                day: {
                  selectedDay: startDate,
                  inRange: (d: Dayjs) => d > startDate && d < endDate,
                  dateFormat,
                } as any,
              }}
              maxDate={endDate.subtract(1, 'day')}
              onChange={(date) => setStartDate(date as Dayjs)}
              value={startDate}
            />
            <DateCalendar
              {...commonProps}
              view={endPickerView}
              onYearChange={() => setEndPickerView('month')}
              onMonthChange={() => setEndPickerView('day')}
              onViewChange={(newView) => setEndPickerView(newView)}
              slots={{ day: CustomDay as any }}
              slotProps={{
                day: {
                  selectedDay: endDate,
                  inRange: (d: Dayjs) => d > startDate && d < endDate,
                  dateFormat,
                } as any,
              }}
              minDate={startDate.add(1, 'day')}
              onChange={(date) => setEndDate(date as Dayjs)}
              value={endDate}
            />
          </Box>
        </LocalizationProvider>
      </Popover>
    </div>
  );
}
