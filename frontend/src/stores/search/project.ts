import dayjs from 'dayjs';
import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { mapOptions } from '@frontend/components/Map/mapOptions';

import { MapSearch, Period } from '@shared/schema/project';

interface Filters {
  investmentProject?: {
    committees?: string[];
  };
  detailplanProject?: {
    planningZones?: string[];
  };
}

interface ProjectSearch {
  text: string;
  dateRange: Period;
  lifecycleStates: string[];
  map: MapSearch;
  includeWithoutGeom: boolean;
  filters: {
    investmentProject?: {
      committees?: string[];
    };
    detailplanProject?: {
      planningZones?: string[];
    };
  };
}

export const projectSearchParamAtom = atom<ProjectSearch>({
  text: '',
  dateRange: {
    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('year').format('YYYY-MM-DD'),
  },
  lifecycleStates: [],
  map: {
    zoom: mapOptions.tre.defaultZoom,
    extent: mapOptions.tre.extent,
  },
  includeWithoutGeom: false,
  filters: {} as const,
});

export const textAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('text'));
export const dateRangeAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('dateRange'));
export const lifecycleStatesAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('lifecycleStates')
);
export const includeWithoutGeomAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('includeWithoutGeom')
);

export const filtersAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('filters'));

export const investmentProjectFiltersAtom = focusAtom(filtersAtom, (o) =>
  o.prop('investmentProject')
);

export const detailplanProjectFiltersAtom = focusAtom(filtersAtom, (o) =>
  o.prop('detailplanProject')
);
