import { Box, Button, Paper, Popper, css } from '@mui/material';
import { GridEditSingleSelectCellProps, useGridApiContext } from '@mui/x-data-grid';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

import { CustomDay } from '@frontend/components/forms/DateRange';
import { langAtom, useTranslations } from '@frontend/stores/lang';

interface DateRangeViewProps {
  value: { startDate: string; endDate: string };
}

export function DateRangeView({ value }: DateRangeViewProps) {
  return (
    <span>
      <span>{dayjs(value.startDate).format('DD.MM.YYYY')}</span>
      <span> {'\u2014'} </span>
      <span>{dayjs(value.endDate).format('DD.MM.YYYY')}</span>
    </span>
  );
}

export function DateRangeEdit(params: GridEditSingleSelectCellProps) {
  const apiRef = useGridApiContext();
  const anchorElRef = useRef<HTMLDivElement>(null);

  const [startDate, setStartDate] = useState(dayjs(params.value.startDate));
  const [endDate, setEndDate] = useState(dayjs(params.value.endDate));
  const [open, setOpen] = useState(false);

  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const dateFormat = tr('date.format');
  const [startPickerView, setStartPickerView] = useState<'year' | 'month' | 'day'>('year');
  const [endPickerView, setEndPickerView] = useState<'year' | 'month' | 'day'>('year');

  useEffect(() => {
    if (anchorElRef.current) {
      setOpen(true);
    }
  }, [anchorElRef.current]);

  return (
    <Box ref={anchorElRef}>
      <Box
        css={(theme) => css`
          padding: ${theme.spacing(1)};
        `}
      >
        <i>{startDate.format('DD.MM.YYYY')}</i>
        <span> {'\u2014'} </span>
        <i>{endDate.format('DD.MM.YYYY')}</i>
      </Box>
      <Popper open={open} anchorEl={anchorElRef.current?.parentElement} placement={'bottom-start'}>
        {open && (
          <Paper
            css={css`
              display: flex;
              flex-direction: column;
            `}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
              <Box
                css={css`
                  display: flex;
                  flex-direction: row;
                `}
              >
                <DateCalendar
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
                  onChange={(date) => setStartDate(date ?? startDate)}
                  value={startDate}
                />
                <DateCalendar
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
                  onChange={(date) => setEndDate(date ?? endDate)}
                  value={endDate}
                />
              </Box>
            </LocalizationProvider>
            <Box
              css={css`
                justify-content: flex-end;
                display: flex;
                padding: 16px;
                gap: 8px;
              `}
            >
              <Button
                variant="outlined"
                onClick={() => {
                  apiRef.current.stopCellEditMode({
                    id: params.id,
                    field: params.field,
                  });
                  setOpen(false);
                }}
              >
                {tr('cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  apiRef.current.setEditCellValue({
                    id: params.id,
                    field: params.field,
                    value: {
                      startDate: startDate.format('YYYY-MM-DD'),
                      endDate: endDate.format('YYYY-MM-DD'),
                    },
                  });
                  apiRef.current.stopCellEditMode({
                    id: params.id,
                    field: params.field,
                  });
                  setOpen(false);
                }}
              >
                {tr('genericForm.accept')}
              </Button>
            </Box>
          </Paper>
        )}
      </Popper>
    </Box>
  );
}
