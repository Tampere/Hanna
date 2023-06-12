import { Theme as MuiTheme } from '@mui/material/styles';

declare module '@emotion/react' {
  export interface Theme extends MuiTheme {}
}

export type ProjectTypePath = 'investointihanke' | 'asemakaavahanke';
