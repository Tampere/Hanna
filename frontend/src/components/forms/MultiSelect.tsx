import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Autocomplete, Checkbox, Chip, CircularProgress, Popover, TextField } from '@mui/material';
import { useRef, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

export type Props<T> = {
  id?: string;
  options: readonly T[];
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
  getOptionLabel: (item: T) => string;
  getOptionId: (item: T) => string;
  multiple: boolean;
} & (
  | {
      multiple: true;
      value: T[] | null;
      onChange: (newValue: T[]) => void;
    }
  | {
      multiple?: false;
      value: T | null;
      onChange: (newValue: T | null) => void;
    }
);

export function MultiSelect<T>({
  id,
  options,
  loading,
  multiple,
  value,
  disabled,
  readOnly,
  onChange,
  onBlur,
  getOptionLabel,
  getOptionId,
}: Props<T>) {
  const tr = useTranslations();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const autocompleteRef = useRef<HTMLElement>();

  function getOption(id: string | null) {
    return options.find((option) => getOptionId(option) === id);
  }

  function getLabel(optionId: string | null) {
    const option = getOption(optionId);
    if (!option) {
      return '';
    }
    return getOptionLabel(option);
  }

  return (
    <Autocomplete
      id={id}
      readOnly={readOnly}
      multiple={multiple}
      size="small"
      clearOnBlur={true}
      options={options?.map((option) => getOptionId(option)) ?? []}
      disabled={disabled}
      disableCloseOnSelect={multiple}
      ref={autocompleteRef}
      value={!value ? null : Array.isArray(value) ? value.map(getOptionId) : getOptionId(value)}
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

        // Type of `newSelection` (array or not) should always correspond to `multiple`, but check it to be safe
        // and for better type inference
        if (multiple) {
          onChange(
            !Array.isArray(newSelection)
              ? []
              : newSelection.map(getOption).filter((option): option is T => Boolean(option))
          );
        } else {
          onChange(Array.isArray(newSelection) ? null : getOption(newSelection) ?? null);
        }
      }}
      onBlur={onBlur}
      getOptionLabel={getLabel}
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
                    <Chip {...getTagProps({ index })} label={getLabel(id)} />
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
            title={getLabel(value[0])}
            label={getLabel(value[0])}
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
          {getLabel(id)}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          value={value ?? ''}
          variant={readOnly ? 'filled' : 'outlined'}
          hiddenLabel={readOnly}
          InputProps={{
            ...params.InputProps,
            style: { flexWrap: 'nowrap' },
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    ></Autocomplete>
  );
}
