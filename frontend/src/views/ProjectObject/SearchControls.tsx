import { Search } from '@mui/icons-material';
import {
  Box,
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
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { mapOptions } from '@frontend/components/Map/mapOptions';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DateRange } from '@frontend/components/forms/DateRange';
import { UserSelect } from '@frontend/components/forms/UserSelect';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import {
  dateRangeAtom,
  includeWithoutGeomAtom,
  lifecycleStatesAtom,
  mapAtom,
  objectCategoryAtom,
  objectParticipantUserAtom,
  objectStageAtom,
  objectTypeAtom,
  objectUsageAtom,
  projectObjectNameAtom,
  rakennuttajaUsersAtom,
  suunnitteluttajaUsersAtom,
} from '@frontend/stores/search/projectObject';

import { isoDateFormat } from '@shared/date';

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

  const [dateRange, setDateRange] = useAtom(dateRangeAtom);
  const [lifecycleStates, setLifecycleStates] = useAtom(lifecycleStatesAtom);
  const [includeWithoutGeom, setIncludeWithoutGeom] = useAtom(includeWithoutGeomAtom);
  const [projectObjectName, setProjectObjectName] = useAtom(projectObjectNameAtom);
  const [objectStage, setObjectStage] = useAtom(objectStageAtom);
  const [objectTypes, setObjectTypes] = useAtom(objectTypeAtom);
  const [objectCategories, setObjectCategories] = useAtom(objectCategoryAtom);
  const [objectUsages, setObjectUsages] = useAtom(objectUsageAtom);
  const [objectParticipantUser, setObjectParticipantUser] = useAtom(objectParticipantUserAtom);
  const [suunnitteluttajaUsers, setSuunnitteluttajaUsers] = useAtom(suunnitteluttajaUsersAtom);
  const [rakennuttajaUsers, setRakennuttajaUsers] = useAtom(rakennuttajaUsersAtom);
  const currentUser = useAtomValue(asyncUserAtom);
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
          <FormLabel htmlFor="project-object-search">
            {tr('projectObjectSearch.projectObjectSearchLabel')}
          </FormLabel>
          <TextField
            id="project-object-search"
            size="small"
            placeholder={tr('itemSearch.textSearchTip')}
            value={projectObjectName}
            onChange={(event) => {
              setProjectObjectName(event.currentTarget.value);
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
          <FormLabel htmlFor="objectStageField">{tr('projectObject.objectStageLabel')}</FormLabel>
          <CodeSelect
            multiple
            maxTags={1}
            codeListId="KohteenLaji"
            value={objectStage}
            onChange={(stages) => setObjectStage(stages)}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="objectTypeField">{tr('projectObject.objectTypeLabel')}</FormLabel>
          <CodeSelect
            multiple
            maxTags={1}
            codeListId="KohdeTyyppi"
            value={objectTypes}
            onChange={(types) => setObjectTypes(types)}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="objectCategoryField">
            {tr('projectObject.objectCategoryLabelShort')}
          </FormLabel>
          <CodeSelect
            multiple
            maxTags={1}
            codeListId="KohteenOmaisuusLuokka"
            value={objectCategories}
            onChange={(categories) => setObjectCategories(categories)}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="objectUsageField">
            {tr('projectObject.objectUsageLabelShort')}
          </FormLabel>
          <CodeSelect
            multiple
            maxTags={1}
            codeListId="KohteenToiminnallinenKayttoTarkoitus"
            value={objectUsages}
            onChange={(usages) => setObjectUsages(usages)}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="lifecycle-state">{tr('projectObject.lifecycleStateLabel')}</FormLabel>
          <CodeSelect
            id="lifecycle-state"
            codeListId="KohteenElinkaarentila"
            multiple
            value={lifecycleStates}
            onChange={setLifecycleStates}
            maxTags={1}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="rakennuttaja">{tr('projectObjectSearch.rakennuttajaUser')}</FormLabel>
          <UserSelect
            id="rakennuttaja"
            multiple
            value={rakennuttajaUsers}
            onChange={setRakennuttajaUsers}
            maxTags={1}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="suunnitteluttaja">
            {tr('projectObjectSearch.suunnitteluttajaUser')}
          </FormLabel>
          <UserSelect
            id="suunnitteluttaja"
            multiple
            value={suunnitteluttajaUsers}
            onChange={setSuunnitteluttajaUsers}
            maxTags={1}
          />
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
          label={tr('projectObjectSearch.showOnlyItemsWithGeom')}
          labelPlacement="end"
        />

        <FormControlLabel
          css={css`
            align-self: end;
          `}
          control={
            <Switch
              checked={!!objectParticipantUser}
              onChange={() => {
                if (objectParticipantUser) {
                  setObjectParticipantUser(null);
                  return;
                }
                setObjectParticipantUser(currentUser.id);
              }}
              color="primary"
            />
          }
          label={tr('workTable.participantFilterLabel')}
          labelPlacement="end"
        />
      </div>
    </Paper>
  );
}
