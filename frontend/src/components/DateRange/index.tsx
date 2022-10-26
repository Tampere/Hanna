import { css } from '@emotion/react';
import { TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export function DateRange() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        <DatePicker
          onChange={(e) => console.log(e)}
          inputFormat="DD.MM.YYYY"
          value={new Date()}
          renderInput={(params) => <TextField size="small" {...params} />}
        />
        <span> — </span>
        <DatePicker
          onChange={(e) => console.log(e)}
          inputFormat="DD.MM.YYYY"
          value={new Date()}
          renderInput={(params) => <TextField size="small" {...params} />}
        />
      </div>
    </LocalizationProvider>
  );
}
