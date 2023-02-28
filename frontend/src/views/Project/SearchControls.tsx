import { Search, UnfoldLess, UnfoldMore } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputAdornment,
  Paper,
  TextField,
  css,
} from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';

import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DateRange } from '@frontend/components/forms/DateRange';
import { useTranslations } from '@frontend/stores/lang';
import {
  getProjectSearchParamSetters,
  getProjectSearchParams,
} from '@frontend/stores/search/project';

const searchControlContainerStyle = css`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

//! FIXME: duplicated a lot, put to shared
const isoFormat = 'YYYY-MM-DD';

function makeCalendarQuickSelections(tr: ReturnType<typeof useTranslations>) {
  const yearSelections = [];
  for (let i = 1; i <= 5; i++) {
    yearSelections.push({
      label: dayjs().subtract(i, 'year').format('YYYY'),
      period: {
        startDate: dayjs().subtract(i, 'year').startOf('year').format(isoFormat),
        endDate: dayjs().subtract(i, 'year').endOf('year').format(isoFormat),
      },
    });
  }

  const labeledSelections = [
    {
      label: tr('projectSearch.calendarQuickSelection.nextYear'),
      period: {
        startDate: dayjs().add(1, 'year').startOf('year').format(isoFormat),
        endDate: dayjs().add(1, 'year').endOf('year').format(isoFormat),
      },
    },
    {
      label: tr('projectSearch.calendarQuickSelection.thisYear'),
      period: {
        startDate: dayjs().startOf('year').format(isoFormat),
        endDate: dayjs().endOf('year').format(isoFormat),
      },
    },
  ] as const;

  return [...labeledSelections, ...yearSelections];
}

export function SearchControls() {
  const tr = useTranslations();

  const [expanded, setExpanded] = useState(false);

  const searchParams = getProjectSearchParams();
  const setSearchParams = getProjectSearchParamSetters();

  return (
    <Paper elevation={1} css={searchControlContainerStyle}>
      <FormControl>
        <FormLabel htmlFor="text-search">{tr('projectSearch.textSearchLabel')}</FormLabel>
        <TextField
          id="text-search"
          size="small"
          placeholder={tr('projectSearch.textSearchTip')}
          value={searchParams.text}
          onChange={(event) => {
            setSearchParams.text(event.currentTarget.value);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </FormControl>
      <Box sx={{ display: 'flex' }}>
        <FormControl>
          <FormLabel>{tr('projectSearch.dateRange')}</FormLabel>
          <DateRange
            value={searchParams.dateRange}
            onChange={(period) => setSearchParams.dateRange(period)}
            quickSelections={makeCalendarQuickSelections(tr)}
          />
        </FormControl>
      </Box>
      <FormControl>
        <FormLabel htmlFor="lifecycle-state">{tr('project.lifecycleStateLabel')}</FormLabel>
        <CodeSelect
          id="lifecycle-state"
          codeListId="HankkeenElinkaarentila"
          multiple
          value={searchParams.lifecycleStates}
          onChange={setSearchParams.lifecycleStates}
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="project-type">{tr('project.projectTypeLabel')}</FormLabel>
        <CodeSelect
          id="project-type"
          codeListId="HankeTyyppi"
          multiple
          value={searchParams.projectTypes}
          onChange={setSearchParams.projectTypes}
        />
      </FormControl>
      {expanded && (
        <>
          <FormControl>
            <FormLabel htmlFor="committee">{tr('project.committeeLabel')}</FormLabel>
            <CodeSelect
              id="committee"
              codeListId="Lautakunta"
              multiple
              value={searchParams.committees}
              onChange={setSearchParams.committees}
            />
          </FormControl>
          <FormGroup>
            <FormLabel>{tr('projectSearch.geometry')}</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  checked={searchParams.includeWithoutGeom}
                  onChange={(_, checked) => {
                    setSearchParams.includeWithoutGeom(checked);
                  }}
                />
              }
              label={tr('projectSearch.showWithoutGeom')}
            />
          </FormGroup>
        </>
      )}
      <Button
        size="small"
        sx={{ gridColumnStart: 4 }}
        endIcon={expanded ? <UnfoldLess /> : <UnfoldMore />}
        onClick={() => {
          setExpanded((previous) => !previous);
        }}
      >
        {expanded ? tr('projectSearch.showLessBtnLabel') : tr('projectSearch.showMoreBtnLabel')}
      </Button>
    </Paper>
  );
}
