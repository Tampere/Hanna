import { useAtomValue } from 'jotai';
import { CodeId } from 'tre-hanna-shared/src/schema/code';

import { trpc } from '@frontend/client';
import { langAtom } from '@frontend/stores/lang';

interface Props {
  codeListId: CodeId['codeListId'];
  value: string;
}

export function CodeSpan({ codeListId, value }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });
  const lang = useAtomValue(langAtom);

  function getLabel(codeValue: string | string[]) {
    const code = codes.data?.find((code) => code.id.id === codeValue);
    return code?.text[lang] ?? value;
  }

  return <span>{getLabel(value)}</span>;
}
