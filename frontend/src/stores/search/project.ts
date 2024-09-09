import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { mapOptions } from '@frontend/components/Map/mapOptions';

import { ProjectSearch } from '@shared/schema/project';

// Use the shared schema as base, but omit unused fields and mark the rest as required
type SearchParams = Omit<Required<ProjectSearch>, 'limit' | 'projectTypes' | 'withProjectObjects'>;

const projectSearchDefaultValues = {
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
  includeWithoutGeom: true,
  filters: {} as const,
  onlyCoversMunicipality: false,
};

export const projectSearchParamAtom = atom<SearchParams>(projectSearchDefaultValues);

export const textAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('text'));
export const dateRangeAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('dateRange'));
export const lifecycleStatesAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('lifecycleStates'),
);
export const ownersAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('owners'));
export const includeWithoutGeomAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('includeWithoutGeom'),
);

export const filtersAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('filters'));

export const investmentProjectFiltersAtom = focusAtom(filtersAtom, (o) =>
  o.prop('investmentProject'),
);

export const detailplanProjectFiltersAtom = focusAtom(filtersAtom, (o) =>
  o.prop('detailplanProject'),
);

export const mapAtom = focusAtom(projectSearchParamAtom, (o) => o.prop('map'));

export const onlyCoversMunicipalityAtom = focusAtom(projectSearchParamAtom, (o) =>
  o.prop('onlyCoversMunicipality'),
);

export function calculateUsedSearchParamsCount(searchParams: SearchParams): number {
  return (Object.keys(searchParams) as (keyof SearchParams)[]).reduce((count, key) => {
    if (key === 'map') {
      return count;
    }
    if (
      key === 'dateRange' &&
      searchParams[key].startDate === projectSearchDefaultValues.dateRange.startDate &&
      searchParams[key].endDate === projectSearchDefaultValues.dateRange.endDate
    ) {
      return count;
    }

    const keyValue = searchParams[key];
    if (Array.isArray(keyValue) && keyValue.length === 0) {
      return count;
    }

    if (typeof keyValue === 'object' && Object.keys(keyValue).length === 0) {
      return count;
    }

    if (key === 'filters') {
      // Object has keys so subCount is at least 1
      let subCount = 1;
      Object.values(searchParams.filters).forEach((value) => {
        if (value && typeof value === 'object' && Object.keys(value).length > 0) {
          if (Object.values(value).some((val) => val.length > 0)) {
            subCount++;
          }
        }
      });
      return count + subCount;
    }

    if (keyValue === projectSearchDefaultValues[key]) {
      return count;
    }

    return count + 1;
  }, 0);
}
