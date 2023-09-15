import { css } from '@emotion/react';
import { Tooltip } from '@mui/material';
import { useAtomValue } from 'jotai';
import { CodeId } from 'tre-hanna-shared/src/schema/code';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';

interface Props {
  codeListId: CodeId['codeListId'];
  value: string[];
  maxItemsToShow?: number;
}

const TOOLTIP_DELAY_MS = 250;

export function CodeSpanMulti({ codeListId, value, maxItemsToShow = 2 }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });
  const lang = useAtomValue(langAtom);
  const tr = useTranslations();

  function getLabel(codeValues: string[]) {
    if (!codeValues) {
      return [];
    }
    return codeValues.map((codeValue) => {
      const code = codes.data?.find((code) => code.id.id === codeValue);
      return code?.text[lang] ?? codeValue;
    });
  }

  if (value.length > maxItemsToShow) {
    return (
      <span>
        {getLabel(value.slice(0, maxItemsToShow)).join(', ')}{' '}
        <Tooltip
          title={`… ${getLabel(value.slice(maxItemsToShow)).join(', ')}`}
          enterDelay={TOOLTIP_DELAY_MS}
        >
          <span
            css={css`
              cursor: help;
              text-decoration-line: underline;
              text-decoration-thickness: 2px;
              text-decoration-style: dotted;
              text-decoration-color: #999;
              text-underline-offset: 3px;
            `}
          >
            {tr('numberOfItems', value.length - maxItemsToShow)}
          </span>
        </Tooltip>
      </span>
    );
  } else {
    return <span>{getLabel(value).join(', ')}</span>;
  }
}
