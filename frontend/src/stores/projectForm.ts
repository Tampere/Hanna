import { atom } from 'jotai';

interface ProjectInputAtom {
  coversMunicipality: boolean;
  externalFormVisible: boolean;
}

export const investmentProjectFormAtom = atom<ProjectInputAtom>({
  coversMunicipality: false,
  externalFormVisible: false,
});

export const maintenanceProjectFormAtom = atom<ProjectInputAtom>({
  coversMunicipality: false,
  externalFormVisible: false,
});
