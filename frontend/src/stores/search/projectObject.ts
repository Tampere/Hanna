import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { atomWithReset } from 'jotai/utils';

import { mapOptions } from '@frontend/components/Map/mapOptions';

import { ProjectObjectSearchParams } from '@shared/schema/userSavedSearchFilters';

const projectObjectSearchDefaultValues = {
  projectObjectName: '',
  projectName: '',
  dateRange: {
    startDate: null,
    endDate: null,
  },
  lifecycleStates: [],
  map: {
    zoom: mapOptions.tre.defaultZoom,
    extent: mapOptions.tre.extent,
  },
  includeWithoutGeom: true,
  objectStages: [],
  objectTypes: [],
  objectCategories: [],
  objectUsages: [],
  objectParticipantUser: null,
  rakennuttajaUsers: [],
  suunnitteluttajaUsers: [],
};

export const projectObjectSearchParamAtom = atomWithReset<ProjectObjectSearchParams>(
  projectObjectSearchDefaultValues,
);

export const selectedSavedProjectObjectSearchFilterAtom = atom<{
  id: string | null;
  isEditing: boolean;
}>({
  id: null,
  isEditing: false,
});

export const projectObjectSearchParamsAtomWithoutMap = focusAtom(
  projectObjectSearchParamAtom,
  (o) => {
    return o.pick(
      Object.keys(projectObjectSearchDefaultValues).filter((key) => key !== 'map') as Exclude<
        keyof ProjectObjectSearchParams,
        'map'
      >[],
    );
  },
);

export const dateRangeAtom = focusAtom(projectObjectSearchParamAtom, (o) => o.prop('dateRange'));
export const lifecycleStatesAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('lifecycleStates'),
);
export const projectObjectNameAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('projectObjectName'),
);
export const projectNameAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('projectName'),
);
export const includeWithoutGeomAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('includeWithoutGeom'),
);
export const objectStageAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('objectStages'),
);
export const objectTypeAtom = focusAtom(projectObjectSearchParamAtom, (o) => o.prop('objectTypes'));
export const objectCategoryAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('objectCategories'),
);
export const objectUsageAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('objectUsages'),
);
export const rakennuttajaUsersAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('rakennuttajaUsers'),
);
export const suunnitteluttajaUsersAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('suunnitteluttajaUsers'),
);

export const objectParticipantUserAtom = focusAtom(projectObjectSearchParamAtom, (o) =>
  o.prop('objectParticipantUser'),
);

export const mapAtom = focusAtom(projectObjectSearchParamAtom, (o) => o.prop('map'));

export function calculateUsedSearchParamsCount(searchParams: ProjectObjectSearchParams) {
  return (Object.keys(searchParams) as (keyof ProjectObjectSearchParams)[]).reduce((count, key) => {
    if (key === 'map') {
      return count;
    }
    if (
      key === 'dateRange' &&
      searchParams[key].startDate === projectObjectSearchDefaultValues.dateRange.startDate &&
      searchParams[key].endDate === projectObjectSearchDefaultValues.dateRange.endDate
    ) {
      return count;
    }

    const keyValue = searchParams[key];
    if (Array.isArray(keyValue) && keyValue.length === 0) {
      return count;
    }

    if (keyValue === projectObjectSearchDefaultValues[key]) {
      return count;
    }

    if (keyValue && typeof keyValue === 'object' && Object.keys(keyValue).length === 0) {
      return count;
    }

    return count + 1;
  }, 0);
}
