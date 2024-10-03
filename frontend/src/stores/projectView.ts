import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';

export type ModifiableField = keyof DirtyAndValidFields;

export interface DirtyAndValidFields {
  form: { isDirty?: boolean; isValid: boolean };
  map: { isDirtyAndValid: boolean };
  finances: { isDirtyAndValid: boolean };
  permissions: { isDirtyAndValid: boolean };
}

const defaultDirtyAndValidViews: DirtyAndValidFields = {
  form: { isDirty: false, isValid: false },
  map: { isDirtyAndValid: false },
  finances: { isDirtyAndValid: false },
  permissions: { isDirtyAndValid: false },
};

export const projectEditingAtom = atom(false);

export const dirtyAndValidFieldsAtom = atomWithReset(defaultDirtyAndValidViews);
