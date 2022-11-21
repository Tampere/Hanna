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
import { useState } from 'react';

import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { DatePicker } from '@frontend/components/forms/DatePicker';
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
          <FormLabel>{tr('project.startDateLabel')}</FormLabel>
          <DatePicker value={searchParams.startDate} onChange={setSearchParams.startDate} />
        </FormControl>
        <FormControl sx={{ ml: 2 }}>
          <FormLabel>{tr('project.endDateLabel')}</FormLabel>
          <DatePicker value={searchParams.endDate} onChange={setSearchParams.endDate} />
        </FormControl>
      </Box>
      <FormControl>
        <FormLabel>{tr('project.lifecycleStateLabel')}</FormLabel>
        <CodeSelect
          codeListId="HankkeenElinkaarentila"
          multiple
          value={searchParams.lifecycleStates}
          onChange={setSearchParams.lifecycleStates}
        />
      </FormControl>
      <FormControl>
        <FormLabel>{tr('project.projectTypeLabel')}</FormLabel>
        <CodeSelect
          codeListId="Hanketyyppi"
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
            <Select disabled size="small"></Select>
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
