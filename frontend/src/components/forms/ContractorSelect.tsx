import { Autocomplete, Box, CircularProgress, TextField } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import type { SearchResult } from '@shared/schema/contractor';
import { debounce } from '@shared/utils';

interface Props {
  value?: string;
  onBlur?: () => void;
  readonlyProps?: {
    hiddenLabel?: boolean;
    variant?: 'filled';
    InputProps?: {
      readOnly: boolean;
    };
  };
  onChange: (value: string) => void;
}

export function ContractorSelect(props: Props) {
  const tr = useTranslations();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);

  const contractor = trpc.contractor.getContractorById.useQuery(
    { id: props.value } as { id: string },
    { enabled: !!props.value }
  );

  useEffect(() => {
    if (contractor.data) {
      setOptions([contractor.data]);
    }
  }, [contractor.data]);

  const searchResults = trpc.contractor.search.useQuery({ query }, { enabled: false });
  const debouncedSearch = useMemo(() => debounce(searchResults.refetch, 500), []);

  useEffect(() => {
    if (query) {
      debouncedSearch();
    }
  }, [query]);

  useEffect(() => {
    if (searchResults.data) {
      setOptions(searchResults.data);
    }
  }, [searchResults.data]);

  function getContractor(id: string) {
    return options.find((contractor) => contractor.id === id);
  }

  return (
    <Box>
      <Autocomplete
        {...props.readonlyProps?.InputProps}
        autoHighlight
        autoSelect
        blurOnSelect
        options={options.map((contractor) => contractor.id)}
        value={props.value || ''}
        onChange={(_, selectedId) => {
          props.onChange(selectedId ?? '');
        }}
        getOptionLabel={(id) => {
          const selection = getContractor(id);
          if (selection) {
            return `${selection.contactName}, ${selection.companyName}, ${selection.emailAddress}`;
          } else {
            return '';
          }
        }}
        filterOptions={(options) => options}
        noOptionsText={tr('contractor.noSearchResults')}
        renderInput={(params) => {
          const { InputProps, ...restParams } = params;
          return (
            <TextField
              {...restParams}
              InputProps={{
                ...InputProps,
                endAdornment: searchResults.isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : (
                  InputProps.endAdornment
                ),
              }}
              {...props.readonlyProps}
              placeholder={tr('contractor.searchPlaceholder')}
              onChange={(e) => setQuery(e.target.value)}
              size="small"
            />
          );
        }}
      />
    </Box>
  );
}
