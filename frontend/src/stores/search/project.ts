import { atom } from 'jotai';

import { unwrapAtomSetters, unwrapAtomValues } from '@frontend/utils/atom';

export const projectSearchParamAtoms = {
  text: atom(''),
  startDate: atom<string | null>(null),
  endDate: atom<string | null>(null),
  lifecycleStates: atom<string[]>([]),
  projectTypes: atom<string[]>([]),
  financingTypes: atom<string[]>([]),
};

export const getProjectSearchParams = () => unwrapAtomValues(projectSearchParamAtoms);
export const getProjectSearchParamSetters = () => unwrapAtomSetters(projectSearchParamAtoms);
