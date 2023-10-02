import { getCodesForCodeList } from '@backend/components/code';

import { codeSearchSchema } from '@shared/schema/code';

import { TRPC } from '.';

export const createCodeRouter = (t: TRPC) =>
  t.router({
    get: t.procedure.input(codeSearchSchema).query(async ({ input }) => {
      return getCodesForCodeList(input.codeListId, input.allowEmptySelection);
    }),
  });
