import { trpc } from '@frontend/client';

import { Language } from '@shared/language';
import { CodeId } from '@shared/schema/code';

type CodeMap = Map<string, { [language in Language]: string }>;

export function useCodes(codeListId: CodeId['codeListId']) {
  const { data } = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });

  const result: CodeMap = new Map();
  data?.forEach((codes) => {
    result.set(codes.id.id, codes.text);
  });
  return result;
}

export function getCommitteeAbbreviation(committee: string) {
  switch (committee) {
    case '01':
      return 'YLA';
    case '02':
      return 'AKILA';
    case '03':
      return 'ELOSA';
    case '04':
      return 'JOLILA';
    default:
      return '';
  }
}
