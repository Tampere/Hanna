import { Box, Button, Paper, Popover, Typography, css } from '@mui/material';
import { GridEditSingleSelectCellProps, useGridApiContext } from '@mui/x-data-grid';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

import { CustomDay } from '@frontend/components/forms/DateRange';
import { langAtom, useTranslations } from '@frontend/stores/lang';

import { isoDateFormat } from '@shared/date';

interface DateRangeViewProps {
  value: { startDate: string; endDate: string };
}

export function DateRangeView({ value }: DateRangeViewProps) {
  return (
    <span>
      <span>{dayjs(value.startDate).format('MM/YYYY')}</span>
      <span> {'\u2014'} </span>
      <span>{dayjs(value.endDate).format('MM/YYYY')}</span>
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
      <Popover
        css={css`
          z-index: 201;
        `}
        open={open}
        anchorEl={anchorElRef.current?.parentElement}
      >
        {open && (
          <Paper
            elevation={3}
            css={css`
              display: flex;
              flex-direction: column;
              background-color: #fafafa;
            `}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={lang}>
              <Box
                css={css`
                  display: flex;
                  flex-direction: row;
                `}
              >
                <Box
                  css={css`
                    display: flex;
                    flex-direction: column;
                  `}
                >
                  <Typography
                    variant="h6"
                    component="p"
                    css={css`
                      padding: 0.5rem 0 0 1.5rem;
                    `}
                  >
                    {tr('project.startDateLabel')}
                  </Typography>
                  <DateCalendar
                    view={startPickerView}
                    views={['year', 'month', 'day']}
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
                </Box>
                <Box
                  css={css`
                    display: flex;
                    flex-direction: column;
                  `}
                >
                  <Typography
                    variant="h6"
                    component="p"
                    css={css`
                      padding: 0.5rem 0 0 1.5rem;
                    `}
                  >
                    {tr('project.endDateLabel')}
                  </Typography>
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
                      startDate: startDate.format(isoDateFormat),
                      endDate: endDate.format(isoDateFormat),
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
      </Popover>
    </Box>
  );
}
