import { sql } from 'slonik';

import { getPool } from '@backend/db';

import { Code, codeSchema, codeSearchSchema } from '@shared/schema/code';

import { TRPC } from '.';

async function getCodesForCodeList(codeListId: Code['id']['codeListId']) {
  return getPool().any(sql.type(codeSchema)`
    SELECT
      json_build_object(
        'codeListId', (code.id).code_list_id,
        'id', (code.id).id
      ) AS id,
      json_build_object(
        'fi', text_fi,
        'en', text_en
      ) AS text
    FROM app.code
    WHERE (code.id).code_list_id = ${codeListId}
  `);
}

export const createCodeRouter = (t: TRPC) =>
  t.router({
    get: t.procedure.input(codeSearchSchema).query(async ({ input }) => {
      return getCodesForCodeList(input.codeListId);
    }),
  });
