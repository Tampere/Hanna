import { Search } from '@mui/icons-material';
import { InputAdornment, TextField, Theme, css } from '@mui/material';
import { SetStateAction } from 'jotai';
import { WorkTableSearch } from 'tre-hanna-shared/src/schema/workTable';

import { CustomFormLabel } from '@frontend/components/forms';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  searchParams: WorkTableSearch;
  setSearchParams: (value: SetStateAction<WorkTableSearch>) => void;
}

export function WorkTableFilters(props: Props) {
  const { searchParams, setSearchParams } = props;
  const tr = useTranslations();

  return (
    <div
      css={(theme: Theme) => css`
        padding: ${theme.spacing(2)} 0;
      `}
    >
      <CustomFormLabel label={tr('projectObject.nameLabelFull')} htmlFor="projectObjectNameField" />
      <TextField
        id="projectObjectNameField"
        size="small"
        variant="outlined"
        type="text"
        placeholder={tr('search.searchTerm')}
        value={searchParams.projectName}
        onChange={(e) => setSearchParams({ ...searchParams, projectName: e.target.value })}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
    </div>
  );
}
