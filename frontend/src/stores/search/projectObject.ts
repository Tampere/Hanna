import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { mapOptions } from '@frontend/components/Map/mapOptions';

import { ProjectObjectSearch } from '@shared/schema/projectObject';

// Use the shared schema as base, but omit unused fields and mark the rest as required
type ObjectSearchParams = Omit<Required<ProjectObjectSearch>, 'limit' | 'projectId'>;

export const projectObjectSearchParamAtom = atom<ObjectSearchParams>({
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
});

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
