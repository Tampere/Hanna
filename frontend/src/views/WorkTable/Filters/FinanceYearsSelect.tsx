import { Check } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  TextField,
  css,
} from '@mui/material';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import { useState } from 'react';

import { useTranslations } from '@frontend/stores/lang';

import { FinanceYears } from '@shared/schema/workTable';

interface Props {
  value: FinanceYears;
  onChange: (value: FinanceYears) => void;
  yearRange?: {
    startYear: number;
    endYear: number;
  };
}

export function FinanceYearsSelect({ value, onChange, yearRange }: Props) {
  const tr = useTranslations();

  const { startYear, endYear } = yearRange ?? {};
  const currentYear = new Date().getFullYear();
  const selectableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selection, setSelection] = useState<FinanceYears['type']>(value.type ?? 'all');
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);

  function renderInputValue(value: FinanceYears) {
    switch (value.type) {
      case 'all':
        return tr('workTable.financesYearsAll');
      case 'yearRange':
        return `${value.startYear} - ${value.endYear}`;
      case 'years':
        return value.years.sort().join(', ');
    }
  }

  function handleChange(newSelection: FinanceYears) {
    setSelection(newSelection.type);
    onChange(newSelection);
    setOpen(false);
  }

  return (
    <Box>
      <TextField
        variant="outlined"
        fullWidth
        size="small"
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowDown') {
            setAnchorEl(e.currentTarget);
            setOpen(true);
          }
        }}
        InputProps={{
          endAdornment: <ArrowDropDownIcon />,
        }}
        value={renderInputValue(value)}
      />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setOpen(false);
          setAnchorEl(null);
        }}
      >
        <MenuItem
          value={'yearRange'}
          disabled={!startYear || !endYear}
          onClick={() => {
            if (!startYear || !endYear) return;
            handleChange({ type: 'yearRange', startYear, endYear });
          }}
        >
          <Radio checked={selection === 'yearRange'} />
          <ListItemText
            primary={tr(
              'workTable.financesYearsRange',
              startYear || endYear ? `${startYear} - ${endYear}` : ''
            )}
          />
        </MenuItem>

        <MenuItem value={'all'} onClick={() => handleChange({ type: 'all' })}>
          <Radio checked={selection === 'all'} />
          <ListItemText primary={tr('workTable.financesYearsAll')} />
        </MenuItem>

        <MenuItem value={'years'} onClick={() => setSelection('years')}>
          <Radio checked={selection === 'years'} />
          <ListItemText primary={tr('workTable.financesYearsSelect')} />
        </MenuItem>

        {selection === 'years' &&
          selectableYears.map((year) => (
            <MenuItem
              key={year}
              sx={{ ml: 2 }}
              onClick={() => {
                if (selectedYears.includes(year)) {
                  setSelectedYears(selectedYears.filter((y) => y !== year));
                } else {
                  setSelectedYears([...selectedYears, year]);
                }
              }}
            >
              <Checkbox checked={selectedYears.includes(year)} />
              <ListItemText primary={year} />
            </MenuItem>
          ))}

        {selection === 'years' && (
          <MenuItem
            css={(theme) => css`
              display: flex;
              justify-content: flex-end;
              margin-top: ${theme.spacing(2)};
            `}
            onClick={() => handleChange({ type: 'years', years: selectedYears })}
          >
            <Button startIcon={<Check />} variant="outlined">
              {tr('genericForm.accept')}
            </Button>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
