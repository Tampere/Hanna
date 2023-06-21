import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { BlanketContractReportQuery } from '@shared/schema/sapReport';

export const blanketContractReportFilterAtom = atom<BlanketContractReportQuery['filters']>({
  text: null,
  consultCompanies: [],
  blanketOrderId: null,
});

// TODO for some reason, jotai-optics type inference broke in current version of TS - ignore the TS errors for now
// @ts-expect-error: Type instantiation is excessively deep and possibly infinite
export const textAtom = focusAtom(blanketContractReportFilterAtom, (o) => o.prop('text'));
export const consultCompaniesAtom = focusAtom(blanketContractReportFilterAtom, (o) =>
  o.prop('consultCompanies')
);
export const blanketOrderIdAtom = focusAtom(blanketContractReportFilterAtom, (o) =>
  o.prop('blanketOrderId')
);
