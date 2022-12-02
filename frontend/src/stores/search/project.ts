import dayjs from 'dayjs';
import { atom } from 'jotai';

import { unwrapAtomSetters, unwrapAtomValues } from '@frontend/utils/atom';

import { Period } from '@shared/schema/project';

export const projectSearchParamAtoms = {
  text: atom(''),
  dateRange: atom<Period>({
    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('year').format('YYYY-MM-DD'),
  }),
  lifecycleStates: atom<string[]>([]),
  projectTypes: atom<string[]>([]),
  financingTypes: atom<string[]>([]),
};

export const getProjectSearchParams = () => unwrapAtomValues(projectSearchParamAtoms);
export const getProjectSearchParamSetters = () => unwrapAtomSetters(projectSearchParamAtoms);
