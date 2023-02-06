import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { trpc } from '@frontend/client';
import { langAtom } from '@frontend/stores/lang';

import type { Code, CodeId } from '@shared/schema/code';

import { MultiSelect } from './MultiSelect';

type Props = {
  id?: string;
  codeListId: CodeId['codeListId'];
  readOnly?: boolean;
  onBlur?: () => void;
} & (
  | {
      multiple: true;
      value?: CodeId['id'][];
      onChange: (newValue: CodeId['id'][]) => void;
    }
  | {
      multiple?: false;
      value?: CodeId['id'];
      onChange: (newValue: CodeId['id'] | null) => void;
    }
);

export function CodeSelect({ id, codeListId, multiple, value, readOnly, onChange, onBlur }: Props) {
  const codes = trpc.code.get.useQuery({ codeListId }, { staleTime: 60 * 60 * 1000 });
  const lang = useAtomValue(langAtom);

  function getCode(id: string) {
    return codes.data?.find((code) => code.id.id === id);
  }

  const selection = useMemo(() => {
    if (!value) {
      return multiple ? [] : null;
    }
    return multiple ? value.map(getCode) : getCode(value);
  }, [multiple, value, codes.data]);

  return multiple ? (
    <MultiSelect
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      options={codes.data ?? []}
      loading={codes.isLoading}
      getOptionLabel={(code) => code.text[lang]}
      getOptionId={(code) => code.id.id}
      value={selection as Code[]}
      onChange={(value) => {
        onChange(value?.map((option) => option.id.id) ?? []);
      }}
      multiple
    />
  ) : (
    <MultiSelect
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      options={codes.data ?? []}
      loading={codes.isLoading}
      getOptionLabel={(code) => code.text[lang]}
      getOptionId={(code) => code.id.id}
      value={selection as Code}
      onChange={(option) => {
        onChange(option?.id.id ?? null);
      }}
      multiple={false}
    />
  );
}
