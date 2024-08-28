import { Search, UnfoldLess, UnfoldMore } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Paper,
  Switch,
  TextField,
  css,
} from '@mui/material';
import dayjs from 'dayjs';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

import { mapOptions } from '@frontend/components/Map/mapOptions';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DateRange } from '@frontend/components/forms/DateRange';
import { ProjectTypeSelect } from '@frontend/components/forms/ProjectTypeSelect';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useTranslations } from '@frontend/stores/lang';
import {
  dateRangeAtom,
  filtersAtom,
  includeWithoutGeomAtom,
  lifecycleStatesAtom,
  mapAtom,
  onlyCoversMunicipalityAtom,
  ownersAtom,
  textAtom,
} from '@frontend/stores/search/project';

import { isoDateFormat } from '@shared/date';

import { DetailplanProjectSearch } from './DetailplanProjectSearch';
import { InvestmentProjectSearch } from './InvestmentProjectSearch';

const searchControlContainerStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

function makeCalendarQuickSelections(tr: ReturnType<typeof useTranslations>) {
  const yearSelections = [];
  for (let i = 1; i <= 5; i++) {
    yearSelections.push({
      label: tr('itemSearch.calendarQuickSelection.year').replace(
        '{year}',
        dayjs().subtract(i, 'year').format('YYYY'),
      ),
      period: {
        startDate: dayjs().subtract(i, 'year').startOf('year').format(isoDateFormat),
        endDate: dayjs().subtract(i, 'year').endOf('year').format(isoDateFormat),
      },
    });
  }

  const labeledSelections = [
    {
      label: tr('itemSearch.calendarQuickSelection.nextYear'),
      period: {
        startDate: dayjs().add(1, 'year').startOf('year').format(isoDateFormat),
        endDate: dayjs().add(1, 'year').endOf('year').format(isoDateFormat),
      },
    },
    {
      label: tr('itemSearch.calendarQuickSelection.thisYear'),
      period: {
        startDate: dayjs().startOf('year').format(isoDateFormat),
        endDate: dayjs().endOf('year').format(isoDateFormat),
      },
    },
  ] as const;

  return [...labeledSelections, ...yearSelections];
}

export function SearchControls() {
  const tr = useTranslations();

  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useAtom(textAtom);
  const [dateRange, setDateRange] = useAtom(dateRangeAtom);
  const [lifecycleStates, setLifecycleStates] = useAtom(lifecycleStatesAtom);
  const [owners, setOwners] = useAtom(ownersAtom);
  const [filters, setFilters] = useAtom(filtersAtom);
  const [includeWithoutGeom, setIncludeWithoutGeom] = useAtom(includeWithoutGeomAtom);
  const [onlyCoversMunicipality, setOnlyCoversMunicipality] = useAtom(onlyCoversMunicipalityAtom);
  const setMap = useSetAtom(mapAtom);

  useEffect(() => {
    return () => {
      setMap((map) => ({
        ...map,
        zoom: mapOptions.tre.defaultZoom,
      }));
    };
  }, []);

  return (
    <Paper
      elevation={1}
      css={css`
        & .MuiFormLabel-root {
          font-size: 12px;
        }
        & .MuiInputBase-input {
          font-size: 12px;
        }
        & .MuiTypography-root {
          font-size: 12px;
        }
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      `}
    >
      <div css={searchControlContainerStyle}>
        <FormControl>
          <FormLabel htmlFor="text-search">{tr('itemSearch.textSearchLabel')}</FormLabel>
          <TextField
            id="text-search"
            size="small"
            placeholder={tr('itemSearch.textSearchTip')}
            value={text}
            onChange={(event) => {
              setText(event.currentTarget.value);
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
            <FormLabel>{tr('itemSearch.dateRange')}</FormLabel>
            <DateRange
              value={dateRange}
              onChange={(period) => setDateRange(period)}
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
            value={lifecycleStates}
            onChange={setLifecycleStates}
            maxTags={1}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="project-type">{tr('projectSearch.projectType')}</FormLabel>
          <ProjectTypeSelect
            id="project-type"
            value={Object.keys(filters) as Array<keyof typeof filters>}
            maxTags={1}
            onChange={(projectTypes) => {
              setFilters((filters) => {
                const previousTypes = new Set(Object.keys(filters)) as Set<keyof typeof filters>;
                const newTypes = new Set(projectTypes);

                // Remove type filters that are no longer selected
                for (const type of previousTypes) {
                  if (!newTypes.has(type)) {
                    delete filters[type];
                  }
                }

                // Add new types
                for (const type of newTypes) {
                  if (!previousTypes.has(type)) {
                    filters[type] = {};
                  }
                }

                return {
                  ...filters,
                };
              });
            }}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="owner">{tr('project.ownerLabel')}</FormLabel>
          <UserSelect id="owner" multiple value={owners} onChange={setOwners} maxTags={1} />
        </FormControl>
        <FormControlLabel
          css={css`
            align-self: end;
            margin-left: auto;
          `}
          control={
            <Switch
              checked={!includeWithoutGeom}
              onChange={(_, checked) => {
                setIncludeWithoutGeom(!checked);
              }}
              color="primary"
            />
          }
          label={tr('projectSearch.showOnlyItemsWithGeom')}
          labelPlacement="end"
        />
        <FormControlLabel
          css={css`
            align-self: end;
            margin-left: auto;
          `}
          control={
            <Switch
              checked={onlyCoversMunicipality}
              onChange={(_, checked) => {
                setOnlyCoversMunicipality(checked);
              }}
              color="primary"
            />
          }
          label={tr('projectSearch.showOnlyItemsThatCoverMunicipality')}
          labelPlacement="end"
        />
      </div>
      {expanded && (
        <>
          {filters['investmentProject'] && <InvestmentProjectSearch />}
          {filters['detailplanProject'] && <DetailplanProjectSearch />}
        </>
      )}
      {(filters.investmentProject || filters.detailplanProject) && (
        <Button
          size="small"
          css={css`
            align-self: flex-end;
          `}
          endIcon={expanded ? <UnfoldLess /> : <UnfoldMore />}
          onClick={() => {
            setExpanded((previous) => !previous);
          }}
        >
          {expanded ? tr('itemSearch.showLessBtnLabel') : tr('itemSearch.showMoreBtnLabel')}
        </Button>
      )}
    </Paper>
  );
}
