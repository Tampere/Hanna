import { getCodesForCodeList } from '@backend/components/code/index.js';

import { codeSearchSchema } from '@shared/schema/code.js';

import { TRPC } from './index.js';

export const createCodeRouter = (t: TRPC) =>
  t.router({
    get: t.procedure.input(codeSearchSchema).query(async ({ input }) => {
      return getCodesForCodeList(input.codeListId, input.allowEmptySelection);
    }),
  });
