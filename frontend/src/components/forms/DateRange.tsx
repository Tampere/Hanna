import { css } from '@emotion/react';
import { CalendarMonthTwoTone, Clear } from '@mui/icons-material';
import { Box, Button, Chip, IconButton, Popover, TextField, Typography } from '@mui/material';
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

import { isoDateFormat } from '@shared/date';

interface Period {
  startDate: string | null;
  endDate: string | null;
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
  if (day?.isSame(selectedDate, 'day')) {
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

export function CustomDay(props: CustomDayProps) {
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
  const [startDate, setStartDate] = useState<Dayjs | null>(
    props.value.startDate ? dayjs(props.value.startDate) : null,
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    props.value.endDate ? dayjs(props.value.endDate) : null,
  );

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
      if (startDate && endDate && startDate >= endDate) {
        return;
      }

      if (
        dayjs(props.value.startDate).isSame(startDate) &&
        dayjs(props.value.endDate).isSame(endDate)
      ) {
        return;
      }

      props.onChange({
        startDate: startDate?.format(isoDateFormat) ?? null,
        endDate: endDate?.format(isoDateFormat) ?? null,
      });
    },
    [startDate, endDate],
  );

  useEffect(() => {
    // This is used when saved search filter with date range is applied.
    // Hackish, but preferring this over lifting state up to keep this component uncoupled.
    if (
      !dayjs(props.value.startDate).isSame(startDate) &&
      !dayjs(props.value.endDate).isSame(endDate)
    ) {
      setStartDate(props.value.startDate ? dayjs(props.value.startDate) : null);
      setEndDate(props.value.endDate ? dayjs(props.value.endDate) : null);
    }
  }, [props.value]);

  function handleQuickSelection(selection: QuickSelection) {
    setStartDate(dayjs(selection.period.startDate));
    setEndDate(dayjs(selection.period.endDate));
    setOpen(false);
  }

  return (
    <div>
      <Box
        css={css`
          display: flex;
          flex-direction: row;
          align-items: center;
        `}
      >
        <TextField
          name="startDate"
          hiddenLabel={props.readOnly}
          variant={props.readOnly ? 'filled' : 'outlined'}
          inputProps={{ readOnly: true }}
          ref={startInput}
          value={props.value.startDate ? dayjs(props.value.startDate).format(dateFormat) : ''}
          size="small"
          onClick={() => setOpen(true)}
          placeholder={tr('dateRange.startDate')}
        />
        <span>—</span>
        <TextField
          name="endDate"
          hiddenLabel={props.readOnly}
          variant={props.readOnly ? 'filled' : 'outlined'}
          inputProps={{ readOnly: props.readOnly }}
          value={props.value.endDate ? dayjs(props.value.endDate).format(dateFormat) : ''}
          size="small"
          onClick={() => setOpen(true)}
          placeholder={tr('dateRange.endDate')}
        />
        <IconButton
          size="small"
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
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                    inRange: (d: Dayjs) => startDate && endDate && d > startDate && d < endDate,
                    dateFormat,
                  } as any,
                }}
                maxDate={endDate?.subtract(1, 'day')}
                onChange={(date) => setStartDate(startDate?.isSame(date) ? null : date)}
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
                    inRange: (d: Dayjs) => startDate && endDate && d > startDate && d < endDate,
                    dateFormat,
                  } as any,
                }}
                minDate={startDate?.add(1, 'day')}
                onChange={(date) => setEndDate(endDate?.isSame(date) ? null : date)}
                value={endDate}
              />
            </Box>
            <Button
              startIcon={<Clear />}
              css={css`
                align-self: flex-end;
                margin: 16px;
              `}
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
                setOpen(false);
              }}
            >
              {tr('clear')}
            </Button>
          </Box>
        </LocalizationProvider>
      </Popover>
    </div>
  );
}
