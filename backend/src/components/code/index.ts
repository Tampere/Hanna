import { sql } from 'slonik';

import { getPool } from '@backend/db';

import { Code, CodeId, EXPLICIT_EMPTY, codeSchema } from '@shared/schema/code';

const codeSelectFragment = sql.fragment`
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
`;

export async function getCodesForCodeList(
  codeListId: Code['id']['codeListId'],
  emptySelection: boolean = false
) {
  const results = await getPool().any(sql.type(codeSchema)`
    ${codeSelectFragment}
    WHERE (code.id).code_list_id = ${codeListId}
  `);

  return emptySelection
    ? [
        {
          id: {
            id: EXPLICIT_EMPTY,
            codeListId,
          },
          text: {
            fi: 'Tyhjä arvo',
            en: 'Empty value',
          },
        },
        ...results,
      ]
    : results;
}

export function codeIdFragment(
  codeListId: CodeId['codeListId'],
  codeId: CodeId['id'] | undefined | null
) {
  if (!codeId) return sql.fragment`NULL`;
  return sql.fragment`
      (${sql.join([codeListId, codeId], sql.fragment`,`)})
    `;
}

export async function getCodeText({ id, codeListId }: CodeId) {
  const { text } = await getPool().one(sql.type(codeSchema)`
    ${codeSelectFragment}
    WHERE
      (code.id).code_list_id = ${codeListId}
      AND (code.id).id = ${id}
  `);
  return text;
}
