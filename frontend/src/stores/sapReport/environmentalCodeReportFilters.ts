import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';

import { EnvironmentCodeReportQuery } from '@shared/schema/sapReport';

export const environmentalCodeReportFilterAtom = atom<EnvironmentCodeReportQuery['filters']>({
  text: null,
  plants: [],
  reasonsForEnvironmentalInvestment: [],
  year: null,
});

// TODO for some reason, jotai-optics type inference broke in current version of TS - ignore the TS errors for now
// @ts-expect-error: Type instantiation is excessively deep and possibly infinite
export const textAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('text'));
export const plantsAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('plants'));
export const reasonsForEnvironmentalInvestmentAtom = focusAtom(
  environmentalCodeReportFilterAtom,
  (o) => o.prop('reasonsForEnvironmentalInvestment')
);
export const yearAtom = focusAtom(environmentalCodeReportFilterAtom, (o) => o.prop('year'));
