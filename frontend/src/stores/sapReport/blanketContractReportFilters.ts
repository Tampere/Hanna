import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { BlanketContractReportQuery } from '@shared/schema/sapReport';

export const blanketContractReportFilterAtom = atom<BlanketContractReportQuery['filters']>({
  text: null,
  consultCompany: null,
  blanketOrderId: null,
});

// TODO for some reason, jotai-optics type inference broke in current version of TS - ignore the TS errors for now
// @ts-expect-error: Type instantiation is excessively deep and possibly infinite
export const textAtom = focusAtom(blanketContractReportFilterAtom, (o) => o.prop('text'));
export const consultCompanyAtom = focusAtom(blanketContractReportFilterAtom, (o) =>
  o.prop('consultCompany')
);
export const blanketOrderIdAtom = focusAtom(blanketContractReportFilterAtom, (o) =>
  o.prop('blanketOrderId')
);
