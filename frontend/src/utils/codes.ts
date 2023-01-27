import { trpc } from '@frontend/client';

import { Language } from '@shared/language';
import { CodeId } from '@shared/schema/code';

export function useCodes(codeListId: CodeId['codeListId']) {
  const { data } = trpc.code.get.useQuery({ codeListId });

  return data?.reduce<Map<string, { [language in Language]: string }>>((codes, code) => {
    codes.set(code.id.id, code.text);
    return codes;
  }, new Map());
}
