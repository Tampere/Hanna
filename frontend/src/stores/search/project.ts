import dayjs from 'dayjs';
import { atom } from 'jotai';

import { mapOptions } from '@frontend/components/Map/mapOptions';
import { unwrapAtomSetters, unwrapAtomValues } from '@frontend/utils/atom';

import { MapSearch, Period } from '@shared/schema/project';

export const projectSearchParamAtoms = {
  text: atom(''),
  dateRange: atom<Period>({
    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('year').format('YYYY-MM-DD'),
  }),
  lifecycleStates: atom<string[]>([]),
  projectTypes: atom<string[]>([]),
  committees: atom<string[]>([]),
  map: atom<MapSearch>({
    zoom: mapOptions.tre.defaultZoom,
    extent: mapOptions.tre.extent,
  }),
};

export const getProjectSearchParams = () => unwrapAtomValues(projectSearchParamAtoms);
export const getProjectSearchParamSetters = () => unwrapAtomSetters(projectSearchParamAtoms);
