import { useAtomValue } from 'jotai';

import { trpc } from '@frontend/client';
import { langAtom } from '@frontend/stores/lang';

import { CodeId } from '@shared/schema/code';

interface Props {
  codeListId: CodeId['codeListId'];
  value: string;
  showCodeListId?: boolean;
}

export function CodeSpan({ codeListId, value, showCodeListId }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });
  const lang = useAtomValue(langAtom);

  function getLabel(codeValue: string | string[]) {
    const code = codes.data?.find((code) => code.id.id === codeValue);
    const codeText = code?.text[lang];
    if (showCodeListId) return codeText ? `${codeText} (${codeValue})` : value;
    return codeText ?? value;
  }

  return <span>{getLabel(value)}</span>;
}
