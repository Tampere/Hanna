import { useMemo } from 'react';

import { trpc } from '@frontend/client';
import { MultiSelect } from '@frontend/components/forms/MultiSelect';

import { Company } from '@shared/schema/company';

interface Props {
  id?: string;
  readOnly?: boolean;
  onBlur?: () => void;
  value: string[];
  onChange: (userIds: string[]) => void;
  maxTags?: number;
}

export function CompanySelect(props: Props) {
  const { id, readOnly, onBlur, value, onChange, maxTags } = props;
  const companies = trpc.company.getAll.useQuery();

  function getCompany(companyId: string) {
    return companies.data?.find((company) => company.businessId === companyId);
  }

  const selection = useMemo(() => {
    if (!value) {
      return [];
    }
    return value.map(getCompany);
  }, [value, companies.data]);

  return (
    <MultiSelect
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      loading={companies.isLoading}
      value={selection as Company[]}
      options={companies.data ?? []}
      getOptionId={(user) => user.businessId}
      getOptionLabel={(user) => user.companyName}
      onChange={(selectedCompanies) =>
        onChange(selectedCompanies.map((company) => company.businessId))
      }
      maxTags={maxTags}
      multiple
    />
  );
}
