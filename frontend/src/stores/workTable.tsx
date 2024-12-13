import dayjs from 'dayjs';
import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';

import { isoDateFormat } from '@shared/date';
import { WorkTableSearch } from '@shared/schema/workTable';

const thisYear = dayjs().year();
export const searchAtom = atomWithReset<WorkTableSearch>({
  objectStartDate: dayjs([thisYear, 0, 1]).format(isoDateFormat).toString(),
  objectEndDate: dayjs([thisYear, 11, 31]).format(isoDateFormat).toString(),
});

export const selectedSavedFilterStateAtom = atom<{
  id: string | null;
  isEditing: boolean;
}>({
  id: null,
  isEditing: false,
});
