import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';

export type ModifiableField = 'form' | 'map' | 'finances' | 'permissions';

const defaultDirtyViews: Record<ModifiableField, boolean> = {
  form: false,
  map: false,
  finances: false,
  permissions: false,
};

export const projectEditingAtom = atom(false);

export const dirtyViewsAtom = atomWithReset(defaultDirtyViews);
