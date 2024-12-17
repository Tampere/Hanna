import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import {
  Autocomplete,
  AutocompleteProps,
  Checkbox,
  Chip,
  CircularProgress,
  Popover,
  TextField,
  css,
} from '@mui/material';
import { ReactElement, useRef, useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

export type Props<T> = {
  id?: string;
  options: readonly T[];
  disabledOptions?: readonly T[];
  disabledTooltip?: string;
  loading?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onBlur?: () => void;
  getOptionLabel?: (item: T) => string;
  optionLabelElement?: (id: string | null) => ReactElement;
  optionIconElement?: (id: string | null) => ReactElement;
  getOptionId?: (item: T) => string;
  /**
   * Overrides MUI AutoComplete's default renderOption function.
   */
  renderOption?: AutocompleteProps<string | null, boolean, boolean, false, 'div'>['renderOption'];
  multiple: boolean;
  disableClearable?: boolean;
} & (
  | {
      multiple: true;
      value: T[] | null;
      onChange: (newValue: T[]) => void;
      maxTags?: number;
    }
  | {
      multiple?: false;
      value: T | null;
      onChange: (newValue: T | null) => void;
      maxTags?: never;
    }
);

export function MultiSelect<T>({
  id,
  options,
  disabledOptions,
  disabledTooltip,
  loading,
  multiple,
  value,
  disabled,
  readOnly,
  onChange,
  onBlur,
  getOptionLabel,
  getOptionId,
  renderOption,
  optionLabelElement,
  optionIconElement,
  maxTags,
  disableClearable,
}: Props<T>) {
  const tr = useTranslations();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const autocompleteRef = useRef<HTMLElement>();

  function getOption(id: string | null) {
    const option = options.find((option) => getOptionId?.(option) === id);
    // If an option wasn't found, return the ID as numeric or string
    return option ?? ((isNaN(Number(id)) ? id : Number(id)) as T);
  }

  function getLabel(optionId: string | null) {
    const option = getOption(optionId);
    if (!option) {
      return '';
    }
    return getOptionLabel?.(option) ?? String(option);
  }

  function getId(option: T) {
    return getOptionId?.(option) ?? String(option);
  }

  const disabledOptionIds = disabledOptions?.map(getId);

  return (
    <Autocomplete
      disableClearable={disableClearable ?? false}
      id={id}
      readOnly={readOnly}
      multiple={multiple}
      size="small"
      clearOnBlur={true}
      options={options?.map(getId) ?? []}
      disabled={disabled}
      disableCloseOnSelect={multiple}
      ref={autocompleteRef}
      value={!value ? null : Array.isArray(value) ? value.map(getId) : getId(value)}
      noOptionsText={tr('select.noOptions')}
      componentsProps={{
        paper: {
          sx: {
            minWidth: 300,
          },
        },
      }}
      onChange={(_, newSelection) => {
        if (maxTags != null && (!newSelection || newSelection.length <= maxTags)) {
          setPopoverOpen(false);
        }

        // Type of `newSelection` (array or not) should always correspond to `multiple`, but check it to be safe
        // and for better type inference
        if (multiple) {
          onChange(
            !Array.isArray(newSelection)
              ? []
              : newSelection.map(getOption).filter((option): option is T => Boolean(option)),
          );
        } else {
          onChange(Array.isArray(newSelection) ? null : getOption(newSelection) ?? null);
        }
      }}
      onBlur={onBlur}
      getOptionLabel={getLabel}
      renderTags={(value, getTagProps) => {
        return maxTags != null && value.length > maxTags ? (
          // Render the popover if selections exceed the maximum tag count
          <>
            <Chip
              css={css`
                font-size: 12px;
                height: 18px;
                &.MuiChip-root {
                  max-width: 60%;
                }
              `}
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
                {value.map((id, index) => {
                  const { key, ...props } = getTagProps({ index });
                  return (
                    <li key={key} style={{ margin: '0.5rem' }}>
                      <Chip {...props} label={getLabel(id)} />
                    </li>
                  );
                })}
              </ul>
            </Popover>
          </>
        ) : maxTags == null || value.length <= maxTags ? (
          // Only render the tags if the limit is not exceeded
          value.map((id, index) => {
            const isDisabled = Boolean(id && disabledOptionIds?.includes(id));
            const { key, ...props } = getTagProps({ index });
            return (
              <Chip
                key={key}
                css={css`
                  font-size: 12px;
                  height: ${optionLabelElement ? 'fit-content' : '18px'};
                  ${optionLabelElement &&
                  `& .MuiChip-label {
                    padding: 6px 8px;
                  };
                  `}
                  &.MuiAutocomplete-tag {
                    max-width: 90%;
                  }
                `}
                {...props}
                {...(isDisabled && { onDelete: undefined })}
                size="small"
                title={getLabel(id)}
                label={optionLabelElement?.(id) ?? getLabel(id)}
              />
            );
          })
        ) : null;
      }}
      renderOption={
        renderOption ??
        ((props, id, { selected }) => {
          const isDisabled = Boolean(id && disabledOptionIds?.includes(id));
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key, ...restProps } = props;
          return (
            <span key={id} {...(isDisabled && { title: disabledTooltip })}>
              <li
                {...restProps}
                style={{
                  hyphens: 'auto',
                  ...(isDisabled && { pointerEvents: 'none', color: 'grey' }),
                }}
                css={css`
                  svg {
                    margin-left: auto;
                  }
                `}
              >
                {multiple && (
                  <Checkbox
                    disabled={isDisabled}
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                    sx={{ mr: 1 }}
                    checked={selected}
                  />
                )}
                {getLabel(id)}
                {optionIconElement?.(id)}
              </li>
            </span>
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          value={value ?? ''}
          variant={readOnly ? 'filled' : 'outlined'}
          hiddenLabel={readOnly}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
