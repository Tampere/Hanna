import { ExpandLess, ExpandMore, Search, UnfoldLess, UnfoldMore } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Switch,
  TextField,
  css,
} from '@mui/material';
import dayjs from 'dayjs';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';

import { mapOptions } from '@frontend/components/Map/mapOptions';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DateRange } from '@frontend/components/forms/DateRange';
import { ProjectTypeSelect } from '@frontend/components/forms/ProjectTypeSelect';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { useTranslations } from '@frontend/stores/lang';
import { freezeMapHeightAtom } from '@frontend/stores/map';
import {
  calculateUsedSearchParamsCount,
  dateRangeAtom,
  filtersAtom,
  includeWithoutGeomAtom,
  lifecycleStatesAtom,
  mapAtom,
  onlyCoversMunicipalityAtom,
  ownersAtom,
  projectSearchParamAtom,
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
  const [isVisible, setIsVisible] = useState(true);
  const [text, setText] = useAtom(textAtom);
  const [dateRange, setDateRange] = useAtom(dateRangeAtom);
  const [lifecycleStates, setLifecycleStates] = useAtom(lifecycleStatesAtom);
  const [owners, setOwners] = useAtom(ownersAtom);
  const [filters, setFilters] = useAtom(filtersAtom);
  const [includeWithoutGeom, setIncludeWithoutGeom] = useAtom(includeWithoutGeomAtom);
  const [onlyCoversMunicipality, setOnlyCoversMunicipality] = useAtom(onlyCoversMunicipalityAtom);
  const setFreezeMapHeight = useSetAtom(freezeMapHeightAtom);
  const allSearchParams = useAtomValue(projectSearchParamAtom);
  const setMap = useSetAtom(mapAtom);

  const searchParamsCount = useMemo(
    () => calculateUsedSearchParamsCount(allSearchParams),
    [text, dateRange, lifecycleStates, owners, filters, includeWithoutGeom, onlyCoversMunicipality],
  );

  function getExpandedHeight(baselineHeight: number) {
    if (filters.investmentProject && filters.detailplanProject) {
      return baselineHeight + 135;
    }
    return baselineHeight;
  }

  useEffect(() => {
    return () => {
      setMap((map) => ({
        ...map,
        zoom: mapOptions.tre.defaultZoom,
      }));
    };
  }, []);

  useEffect(() => {
    if (expanded) {
      handleFreezeMapHeight(350);
    }
  }, [filters]);

  function handleFreezeMapHeight(timeout: number = 500) {
    setFreezeMapHeight(true);
    setTimeout(() => {
      setFreezeMapHeight(false);
    }, timeout);
  }

  const expandButtonVisible = isVisible && (filters.investmentProject || filters.detailplanProject);

  return (
    <Box
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
        padding: ${isVisible ? '16px' : '0 16px '};
        display: flex;
        flex-direction: column;
        gap: ${expanded ? '16px' : 'none'};
        border-radius: 0;
        border-bottom: 1px solid #c4c4c4;
      `}
    >
      <Box
        css={css`
          transition:
            height 0.3s ease-out,
            opacity 0.3s ease-out;
          // Using media queries to get a smooth height transition animation between different screen sizes
          @media (min-width: 1900px) {
            height: ${expanded ? getExpandedHeight(180) : 80}px;
            ${!isVisible && `height: 0; opacity: 0;`};
          }
          @media (1900px >= width >= 1400px) {
            height: ${expanded ? getExpandedHeight(260) : 140}px;
            ${!isVisible && `height: 0; opacity: 0;`};
          }
          @media (1400px >= width >= 1130px) {
            height: ${expanded ? getExpandedHeight(300) : 140}px;
            ${!isVisible && `height: 0; opacity: 0;`};
          }
          @media (max-width: 1130px) {
            height: ${expanded ? getExpandedHeight(350) : 200}px;
            ${!isVisible && `height: 0; opacity: 0;`};
          }
        `}
      >
        {isVisible && (
          <Box>
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
              <Box>
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
                      const prevFilters = { ...filters };
                      const previousTypes = new Set(Object.keys(prevFilters)) as Set<
                        keyof typeof prevFilters
                      >;
                      const newTypes = new Set(projectTypes);

                      // Remove type filters that are no longer selected
                      for (const type of previousTypes) {
                        if (!newTypes.has(type)) {
                          delete prevFilters[type];
                        }
                      }

                      // Add new types
                      for (const type of newTypes) {
                        if (!previousTypes.has(type)) {
                          prevFilters[type] = {};
                        }
                      }

                      return { ...prevFilters };
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
          </Box>
        )}
      </Box>
      <Box
        css={css`
          display: flex;
          justify-content: flex-end;
          transition: opacity 1s ease-out;
          ${!isVisible && 'margin-bottom: 0.5rem;'}
        `}
      >
        {expandButtonVisible && (
          <Button
            css={css`
              margin-right: auto;
            `}
            size="small"
            startIcon={expanded ? <UnfoldLess /> : <UnfoldMore />}
            onClick={() => {
              handleFreezeMapHeight(350);
              setExpanded((previous) => !previous);
            }}
          >
            {expanded ? tr('itemSearch.showLessBtnLabel') : tr('itemSearch.showMoreBtnLabel')}
          </Button>
        )}

        {!isVisible && searchParamsCount > 0 && (
          <Chip
            variant="outlined"
            css={css`
              font-size: 12px;
              border-color: orange;
            `}
            label={
              searchParamsCount === 1
                ? tr('workTable.search.chipLabelSingle')
                : tr('workTable.search.chipLabelMultiple', searchParamsCount)
            }
          />
        )}
        <Button
          size="small"
          css={css`
            margin-left: 0.5rem;
            grid-column: 13;
            height: fit-content;
          `}
          onClick={() => {
            handleFreezeMapHeight(350);
            setIsVisible((prev) => !prev);
            setExpanded(false);
          }}
          endIcon={isVisible ? <ExpandLess /> : <ExpandMore />}
        >
          {isVisible ? tr('workTable.search.hide') : tr('workTable.search.show')}
        </Button>
      </Box>
    </Box>
  );
}
