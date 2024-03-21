import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { trpc } from '@frontend/client';
import { langAtom } from '@frontend/stores/lang';

import { type Code, type CodeId, EXPLICIT_EMPTY } from '@shared/schema/code';

import { MultiSelect } from './MultiSelect';

type Props = {
  id?: string;
  codeListId: CodeId['codeListId'];
  readOnly?: boolean;
  onBlur?: () => void;
  getLabel?: (code: Code) => string;
  showIdInLabel?: boolean;
  allowEmptySelection?: boolean;
  options?: Code[];
  disableClearable?: boolean;
} & (
  | {
      multiple: true;
      value?: CodeId['id'][];
      onChange: (newValue: CodeId['id'][]) => void;
      maxTags?: number;
    }
  | {
      multiple?: false;
      value?: CodeId['id'];
      onChange: (newValue: CodeId['id'] | null) => void;
      maxTags?: never;
    }
);

export function CodeSelect({
  id,
  codeListId,
  multiple,
  value,
  readOnly,
  onChange,
  onBlur,
  showIdInLabel,
  maxTags,
  allowEmptySelection,
  options,
  disableClearable,
}: Props) {
  const codes = trpc.code.get.useQuery(
    { codeListId, allowEmptySelection },
    { staleTime: 60 * 60 * 1000 },
  );
  const lang = useAtomValue(langAtom);

  function getCode(id: string) {
    return codes.data?.find((code) => code.id.id === id);
  }

  function getLabel(code: Code) {
    // empty selection (00) label is not shown
    let labelId = showIdInLabel ? code.id.id : null;
    if (code.id.id === EXPLICIT_EMPTY) {
      labelId = null;
    }

    return [labelId, code.text[lang]].filter(Boolean).join(' ');
  }

  const selection = useMemo(() => {
    if (!value) {
      return multiple ? [] : null;
    }
    return multiple ? value.map(getCode).filter(Boolean) : getCode(value);
  }, [multiple, value, codes.data]);

  return multiple ? (
    <MultiSelect
      disableClearable={disableClearable ?? false}
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      options={options ?? codes.data ?? []}
      loading={codes.isLoading}
      getOptionLabel={getLabel}
      getOptionId={(code) => code.id.id}
      value={selection as Code[]}
      onChange={(value) => {
        onChange(value?.map((option) => option.id.id) ?? []);
      }}
      multiple
      maxTags={maxTags}
    />
  ) : (
    <MultiSelect
      disableClearable={disableClearable ?? false}
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      options={options ?? codes.data ?? []}
      loading={codes.isLoading}
      getOptionLabel={getLabel}
      getOptionId={(code) => code.id.id}
      value={selection as Code}
      onChange={(option) => {
        onChange(option?.id.id ?? null);
      }}
      multiple={false}
    />
  );
}
