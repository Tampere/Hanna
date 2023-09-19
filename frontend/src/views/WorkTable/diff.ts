import type { GridRowId } from '@mui/x-data-grid';
import { Difference } from 'microdiff';

type ModifiedField<T> = {
  [key in keyof T]?: boolean;
};

export type ModifiedFields<T> = {
  [rowId: GridRowId]: ModifiedField<T>;
};

export type WorkTableDiff = Record<GridRowId, Difference[]>;
