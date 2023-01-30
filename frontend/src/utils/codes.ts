import { trpc } from '@frontend/client';

import { Language } from '@shared/language';
import { CodeId } from '@shared/schema/code';

type CodeMap = Map<string, { [language in Language]: string }>;

export function useCodes(codeListId: CodeId['codeListId']) {
  const { data } = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });

  return data?.reduce<CodeMap>((codes, code) => {
    codes.set(code.id.id, code.text);
    return codes;
  }, new Map());
}
