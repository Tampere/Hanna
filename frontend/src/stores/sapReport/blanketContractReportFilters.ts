import { atom, useAtomValue } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { BlanketContractReportQuery } from '@shared/schema/sapReport';

import { useDebounce } from '../../utils/useDebounce';

export const blanketContractReportFilterAtom = atom<BlanketContractReportQuery['filters']>({
  text: null,
  consultCompanies: [],
  blanketOrderIds: [],
  years: [],
});

export const textAtom = focusAtom(blanketContractReportFilterAtom, (o) => o.prop('text'));
export const consultCompaniesAtom = focusAtom(blanketContractReportFilterAtom, (o) =>
  o.prop('consultCompanies'),
);
export const blanketOrderIdsAtom = focusAtom(blanketContractReportFilterAtom, (o) =>
  o.prop('blanketOrderIds'),
);

export function useDebouncedBlanketContractReportFilters() {
  const filters = useAtomValue(blanketContractReportFilterAtom);
  return {
    ...filters,
    text: useDebounce(filters.text, 250),
  };
}

export const yearsAtom = focusAtom(blanketContractReportFilterAtom, (o) => o.prop('years'));
