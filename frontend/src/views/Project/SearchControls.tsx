import { Search, UnfoldLess, UnfoldMore } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  InputAdornment,
  Paper,
  Select,
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
  return [
    {
      label: tr('projectSearch.calendarQuickSelection.lastYear'),
      period: {
        startDate: dayjs().subtract(1, 'year').startOf('year').format(isoFormat),
        endDate: dayjs().subtract(1, 'year').endOf('year').format(isoFormat),
      },
    },
    {
      label: tr('projectSearch.calendarQuickSelection.thisYear'),
      period: {
        startDate: dayjs().startOf('year').format(isoFormat),
        endDate: dayjs().endOf('year').format(isoFormat),
      },
    },
    {
      label: tr('projectSearch.calendarQuickSelection.nextYear'),
      period: {
        startDate: dayjs().add(1, 'year').startOf('year').format(isoFormat),
        endDate: dayjs().add(1, 'year').endOf('year').format(isoFormat),
      },
    },
  ] as const;
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
            <FormLabel>{tr('project.budgetLabel')}</FormLabel>
            <Select disabled size="small"></Select>
          </FormControl>
          <FormControl>
            <FormLabel>{tr('project.financingTypeLabel')}</FormLabel>
            <CodeSelect
              codeListId="Rahoitusmalli"
              multiple
              value={searchParams.financingTypes}
              onChange={setSearchParams.financingTypes}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{tr('project.committeeLabel')}</FormLabel>
            <CodeSelect
              codeListId="Lautakunta"
              multiple
              value={searchParams.committee}
              onChange={setSearchParams.committee}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{tr('project.ownerLabel')}</FormLabel>
            <Select disabled size="small"></Select>
          </FormControl>
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
