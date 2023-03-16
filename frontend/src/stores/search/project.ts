import dayjs from 'dayjs';
import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { mapOptions } from '@frontend/components/Map/mapOptions';

import { MapSearch, Period } from '@shared/schema/project';
import { ProjectType } from '@shared/schema/project/type';

interface ProjectTypeFilters {
  investmentProject: {
    committees: string[];
  };
  detailplanProject: object;
}

interface ProjectSearch {
  text: string;
  dateRange: Period;
  lifecycleStates: string[];
  projectTypes: ProjectType[];
  committees: string[];
  map: MapSearch;
  includeWithoutGeom: boolean;
  filters: ProjectTypeFilters;
}

export const projectSearchParamAtom = atom<ProjectSearch>({
  text: '',
  dateRange: {
    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('year').format('YYYY-MM-DD'),
  },
  lifecycleStates: [],
  projectTypes: [],
  committees: [],
  map: {
    zoom: mapOptions.tre.defaultZoom,
    extent: mapOptions.tre.extent,
  },
  includeWithoutGeom: false,
  filters: {
    investmentProject: { committees: [] },
    detailplanProject: {},
  },
});

export const textAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('text'));
export const dateRangeAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('dateRange'));
export const lifecycleStatesAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('lifecycleStates')
);
export const projectTypesAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('projectTypes'));
export const includeWithoutGeomAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('includeWithoutGeom')
);

export const investmentProjectFiltersAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('filters').prop('investmentProject')
);
