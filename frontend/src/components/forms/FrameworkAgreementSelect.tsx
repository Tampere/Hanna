import { useMemo } from 'react';

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

import { FrameworkAgreement } from '@shared/schema/frameworkAgreement';

import { MultiSelect } from './MultiSelect';

interface Props {
  id?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  /** Agreement already saved for the item. It stays selectable even if it is no longer valid. */
  savedValue?: string | null;
}

export function FrameworkAgreementSelect({
  id,
  value,
  onChange,
  onBlur,
  readOnly,
  savedValue,
}: Readonly<Props>) {
  const tr = useTranslations();
  const frameworkAgreements = trpc.frameworkAgreement.getAll.useQuery({
    includeId: savedValue,
  });

  const options = useMemo(
    () =>
      (frameworkAgreements.data ?? []).filter(
        (agreement) => agreement.isValid || agreement.id === savedValue,
      ),
    [frameworkAgreements.data, savedValue],
  );

  const selection = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  function getLabel(option: FrameworkAgreement) {
    return option.isValid ? option.name : `${option.name} (${tr('frameworkAgreement.notValid')})`;
  }

  return (
    <MultiSelect
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      options={options}
      loading={frameworkAgreements.isLoading}
      getOptionLabel={getLabel}
      getOptionId={(option) => option.id}
      value={selection}
      onChange={(option) => onChange(option?.id ?? null)}
      multiple={false}
    />
  );
}
