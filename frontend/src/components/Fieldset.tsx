import { Typography, css } from '@mui/material';
import { ReactNode } from 'react';

interface Props {
  legend?: string;
  children?: ReactNode;
}

export function Fieldset({ legend, children }: Props) {
  return (
    <fieldset
      css={css`
        border: 1px solid #ccc;
        border-radius: 4px;
      `}
    >
      {legend && (
        <legend>
          <Typography variant="overline">{legend}</Typography>
        </legend>
      )}
      {children}
    </fieldset>
  );
}
