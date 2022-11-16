import { sql } from 'slonik';

import { getPool } from '@backend/db';

import { Code, codeSchema, codeSearchSchema } from '@shared/schema/code';

import { TRPC } from '.';

async function getCodesForCodeList(codeListId: Code['codeListId']) {
  return getPool().any(sql.type(codeSchema)`
    SELECT
      code_list_id as "codeListId",
      id,
      json_build_object(
        'fi', text_fi,
        'en', text_en
      ) as text
    FROM app.code
    WHERE code_list_id = ${codeListId}
  `);
}

export const createCodeRouter = (t: TRPC) =>
  t.router({
    get: t.procedure.input(codeSearchSchema).query(async ({ input }) => {
      return getCodesForCodeList(input.codeListId);
    }),
  });
