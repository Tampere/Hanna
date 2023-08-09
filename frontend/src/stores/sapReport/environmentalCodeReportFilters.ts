import { atom, useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { useDebounce } from '@frontend/utils/useDebounce';

import { EnvironmentCodeReportQuery } from '@shared/schema/sapReport';

export const environmentalCodeReportFilterAtom = atom<EnvironmentCodeReportQuery['filters']>({
  text: null,
  plants: [],
  reasonsForEnvironmentalInvestment: [],
  year: null,
});

export const textAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('text'));
export const plantsAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('plants'));
export const reasonsForEnvironmentalInvestmentAtom = focusAtom(
  environmentalCodeReportFilterAtom,
  (o) => o.prop('reasonsForEnvironmentalInvestment')
);
export const yearAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('year'));

export function useDebouncedEnvironmentalCodeReportFilters() {
  const filters = useAtomValue(environmentalCodeReportFilterAtom);
  return {
    ...filters,
    text: useDebounce(filters.text, 250),
  };
}
