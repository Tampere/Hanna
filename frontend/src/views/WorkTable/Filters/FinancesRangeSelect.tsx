import { Select } from '@mui/material';

import { useTranslations } from '@frontend/stores/lang';

import { FinancesRange } from '@shared/schema/workTable';

interface Props {
  value: FinancesRange;
  onChange: (value: FinancesRange) => void;
  yearRange: {
    startYear: number;
    endYear: number;
  };
  readOnly?: boolean;
}

/**
 * FinancesRangeSelect component props
 * @property {FinancesRange} value - The current selected value
 * @property {(value: FinancesRange) => void} onChange - Handler for change events
 * @property {{startYear: number; endYear: number;}} yearRange - The range of years available for selection
 * @property {boolean} [readOnly] - If true, the select is read-only
 */

export function FinancesRangeSelect({ value, onChange, readOnly, yearRange }: Props) {
  const tr = useTranslations();

  const selectableYears = Array.from(
    { length: yearRange.endYear - yearRange.startYear + 1 },
    (_, i) => yearRange.startYear + i,
  ).reverse();

  return (
    <Select
      disabled={readOnly}
      native
      size="small"
      value={value}
      onChange={({ target }) => {
        if (target.value === 'allYears') {
          onChange('allYears');
        } else {
          onChange(parseInt(target.value as string));
        }
      }}
    >
      <option value="allYears">{tr('workTable.financesAllYears')}</option>
      <optgroup label={tr('workTable.financesYearsSelect')}>
        {selectableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}
