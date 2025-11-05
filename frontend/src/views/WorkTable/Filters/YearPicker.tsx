import { TextField, css } from '@mui/material';

import { trpc } from '@frontend/client';
import dayjs from '@frontend/dayjs';
import { useTranslations } from '@frontend/stores/lang';

import { isoDateFormat } from '@shared/date';

interface Props {
  onChange: (dates: { startDate: string; endDate: string }) => void;
  selectedYear: number | 'allYears';
  allowAllYears?: boolean;
  label?: string;
}

export function YearPicker({ onChange, selectedYear, allowAllYears = true, label }: Props) {
  const tr = useTranslations();
  const yearsQuery = trpc.workTable.years.useQuery();

  function getDate(year: number, forStart: boolean = true, format: string = isoDateFormat) {
    return forStart ? dayjs([year, 0, 1]).format(format) : dayjs([year, 11, 31]).format(format);
  }

  if (!yearsQuery.data) {
    return null;
  }

  return (
    <TextField
      select
      SelectProps={{ native: true }}
      value={selectedYear}
      label={label ?? ''}
      css={(theme) => css`
        & .MuiInputBase-input,
        & .MuiNativeSelect-select,
        & .MuiSelect-select {
          padding: 0.2rem 0.5rem;
          font-weight: 500;
          color: ${theme.palette.primary.main};
          width: 6.5rem;
        }
      `}
      onChange={({ target }) => {
        if (!target.value || !yearsQuery.data) return;

        if (target.value === 'allYears') {
          onChange({
            startDate: getDate(Math.min(...yearsQuery.data)),
            endDate: getDate(Math.max(...yearsQuery.data), false),
          });
        } else {
          const year = Number(target.value);
          onChange({ startDate: getDate(year), endDate: getDate(year, false) });
        }
      }}
    >
      {allowAllYears && <option value="allYears">{tr('workTable.allYears')}</option>}
      <optgroup label={tr('workTable.yearSelect')}>
        {yearsQuery.data?.map((year) => (
          <option
            css={css`
              text-align: center;
            `}
            key={year}
            value={year}
          >
            {year}
          </option>
        ))}
      </optgroup>
    </TextField>
  );
}
