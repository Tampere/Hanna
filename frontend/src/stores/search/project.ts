import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { mapOptions } from '@frontend/components/Map/mapOptions';

import { ProjectSearch } from '@shared/schema/project';

// Use the shared schema as base, but omit unused fields and mark the rest as required
type SearchParams = Omit<Required<ProjectSearch>, 'limit' | 'projectTypes'>;

export const projectSearchParamAtom = atom<SearchParams>({
  text: '',
  dateRange: {
    startDate: null,
    endDate: null,
  },
  lifecycleStates: [],
  owners: [],
  map: {
    zoom: mapOptions.tre.defaultZoom,
    extent: mapOptions.tre.extent,
  },
  includeWithoutGeom: false,
  filters: {} as const,
});

// TODO for some reason, jotai-optics type inference broke in current version of TS - ignore the TS errors for now
// @ts-expect-error: Type instantiation is excessively deep and possibly infinite
export const textAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('text'));
export const dateRangeAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('dateRange'));
export const lifecycleStatesAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('lifecycleStates')
);
export const ownersAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('owners'));
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
