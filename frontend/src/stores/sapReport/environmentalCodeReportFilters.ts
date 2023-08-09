import { atom, useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { useDebounce } from '@frontend/utils/useDebounce';

import { EnvironmentCodeReportQuery } from '@shared/schema/sapReport';

export const environmentalCodeReportFilterAtom = atom<EnvironmentCodeReportQuery['filters']>({
  text: null,
  plants: [],
  reasonsForEnvironmentalInvestment: [],
  years: [],
});

export const textAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('text'));
export const plantsAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('plants'));
export const reasonsForEnvironmentalInvestmentAtom = focusAtom(
  environmentalCodeReportFilterAtom,
  (o) => o.prop('reasonsForEnvironmentalInvestment')
);
export const yearsAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('years'));

export function useDebouncedEnvironmentalCodeReportFilters() {
  const filters = useAtomValue(environmentalCodeReportFilterAtom);
  return {
    ...filters,
    text: useDebounce(filters.text, 250),
  };
}
