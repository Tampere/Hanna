import { FragmentSqlToken, sql } from 'slonik';

import { getPool } from '@backend/db.js';

import { Code, CodeId, EXPLICIT_EMPTY, OrderingOptions, codeSchema } from '@shared/schema/code.js';

const orderingFragments: Record<OrderingOptions['type'], FragmentSqlToken> = {
  alphabetical: sql.fragment`ORDER BY text_fi`,
  custom: sql.fragment`ORDER BY t.ord`,
};

const emptyCode = (codeListId: Code['id']['codeListId']) =>
  ({
    id: {
      id: EXPLICIT_EMPTY,
      codeListId,
    },
    text: {
      fi: 'Tyhjä arvo',
    },
  }) as const;

function getCodeSelectFragment(customOrderById?: string[]) {
  return sql.fragment`
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
  ${
    customOrderById
      ? sql.fragment`LEFT JOIN UNNEST(${sql.array(
          customOrderById,
          'text',
        )}) WITH ORDINALITY t(id, ord) ON (app.code.id).id = t.id`
      : sql.fragment``
  }
`;
}

function getOrderingOptionsByCodeListId(
  codeListId: Code['id']['codeListId'],
): OrderingOptions | null {
  switch (codeListId) {
    case 'KohteenElinkaarentila':
      return { type: 'custom', ids: ['05', '01', '02', '03'] };
    case 'KohteenOmaisuusLuokka':
    case 'KohteenToiminnallinenKayttoTarkoitus':
      return { type: 'alphabetical' };
    default:
      return null;
  }
}

export async function getCodesForCodeList(
  codeListId: Code['id']['codeListId'],
  emptySelection: boolean = false,
) {
  const orderingOptions = getOrderingOptionsByCodeListId(codeListId);

  const results = await getPool().any(sql.type(codeSchema)`
    ${
      orderingOptions?.type === 'custom'
        ? getCodeSelectFragment(orderingOptions.ids)
        : getCodeSelectFragment()
    }
    WHERE (code.id).code_list_id = ${codeListId}
    ${orderingOptions ? orderingFragments[orderingOptions.type] : sql.fragment``}
  `);

  return emptySelection ? [emptyCode(codeListId), ...results] : results;
}

export function codeIdFragment(
  codeListId: CodeId['codeListId'],
  codeId: CodeId['id'] | undefined | null,
) {
  if (!codeId) return sql.fragment`NULL`;
  return sql.fragment`
      (${sql.join([codeListId, codeId], sql.fragment`,`)})
    `;
}

export async function getCodeText({ id, codeListId }: CodeId) {
  const { text } = await getPool().one(sql.type(codeSchema)`
    ${getCodeSelectFragment()}
    WHERE
      (code.id).code_list_id = ${codeListId}
      AND (code.id).id = ${id}
  `);
  return text;
}
