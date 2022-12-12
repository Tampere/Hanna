import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Autocomplete, Checkbox, Chip, CircularProgress, Popover, TextField } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';

import type { Code } from '@shared/schema/code';

type Props = {
  codeListId: Code['codeListId'];
  readOnly?: boolean;
} & (
  | {
      multiple: true;
      value: string[];
      onChange: (newValue: string[]) => void;
    }
  | {
      multiple?: false;
      value: string;
      onChange: (newValue: string) => void;
    }
);

export function CodeSelect({ codeListId, multiple, value, readOnly, onChange }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId });
  const lang = useAtomValue(langAtom);
  const tr = useTranslations();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const autocompleteRef = useRef<HTMLElement>();

  function getCode(id: string) {
    return codes.data?.find((code) => code.id === id);
  }

  return (
    <Autocomplete
      readOnly={readOnly}
      multiple={multiple}
      size="small"
      options={codes.data?.map((code) => code.id) ?? []}
      disabled={!codes.data}
      disableCloseOnSelect
      ref={autocompleteRef}
      value={value}
      noOptionsText={tr('select.noOptions')}
      componentsProps={{
        paper: {
          sx: {
            minWidth: 300,
          },
        },
      }}
      onChange={(_, newSelection) => {
        if (!newSelection || newSelection.length === 1) {
          setPopoverOpen(false);
        }
        // TypeScript infers onChange argument as "string & string[]" even though it should rather be "string | string[]"
        (onChange as (value: string | string[]) => void)(newSelection ?? []);
      }}
      getOptionLabel={(id) => getCode(id)?.text[lang] ?? ''}
      renderTags={(value, getTagProps) => {
        return value.length > 1 ? (
          // Render the popover if there are multiple selections
          <>
            <Chip
              size="small"
              label={`${value.length} ${tr('select.selections')}`}
              color="primary"
              onClick={() => {
                setPopoverOpen((open) => !open);
              }}
            />
            <Popover
              open={popoverOpen}
              onClose={() => {
                setPopoverOpen(false);
              }}
              anchorEl={autocompleteRef.current}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {value.map((id, index) => (
                  <li key={index} style={{ margin: '0.5rem' }}>
                    <Chip {...getTagProps({ index })} label={getCode(id)?.text[lang]} />
                  </li>
                ))}
              </ul>
            </Popover>
          </>
        ) : value.length === 1 ? (
          // Only render the only value as its own chip if there is 1 selection
          <Chip
            {...getTagProps({ index: 0 })}
            size="small"
            title={getCode(value[0])?.text[lang]}
            label={getCode(value[0])?.text[lang]}
          />
        ) : null;
      }}
      renderOption={(props, id, { selected }) => (
        <li {...props} style={{ hyphens: 'auto' }}>
          {multiple && (
            <Checkbox
              icon={<CheckBoxOutlineBlank fontSize="small" />}
              checkedIcon={<CheckBox fontSize="small" />}
              sx={{ mr: 1 }}
              checked={selected}
            />
          )}
          {getCode(id)?.text[lang]}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={readOnly ? 'filled' : 'outlined'}
          hiddenLabel={readOnly}
          InputProps={{
            ...params.InputProps,
            style: { flexWrap: 'nowrap' },
            endAdornment: (
              <>
                {!codes.data ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    ></Autocomplete>
  );
}
