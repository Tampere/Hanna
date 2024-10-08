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
        margin-top: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px 16px 20px 16px;
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
