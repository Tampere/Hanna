import { useMemo } from 'react';

import { trpc } from '@frontend/client';

import type { User } from '@shared/schema/user';

import { MultiSelect } from './MultiSelect';

type Props = {
  id?: string;
  readOnly?: boolean;
  onBlur?: () => void;
} & (
  | {
      multiple: true;
      value: string[];
      onChange: (userIds: string[]) => void;
    }
  | {
      multiple?: false;
      value: string;
      onChange: (userId: string | null) => void;
    }
);

export function UserSelect(props: Props) {
  const { id, readOnly, onBlur, multiple, value, onChange } = props;
  const users = trpc.user.getAll.useQuery();

  function getUser(id: string) {
    return users.data?.find((user) => user.id === id);
  }

  const selection = useMemo(() => {
    if (!value) {
      return multiple ? [] : null;
    }
    return multiple ? value.map(getUser) : getUser(value);
  }, [multiple, value, users.data]);

  return multiple ? (
    <MultiSelect
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      loading={users.isLoading}
      value={selection as User[]}
      options={users.data ?? []}
      getOptionId={(user) => user.id}
      getOptionLabel={(user) => user.name}
      onChange={(users) => onChange(users.map((user) => user.id))}
      multiple
    />
  ) : (
    <MultiSelect
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      loading={users.isLoading}
      value={selection as User}
      options={users.data ?? []}
      getOptionId={(user) => user.id}
      getOptionLabel={(user) => user.name}
      onChange={(user) => onChange(user?.id ?? null)}
      multiple={false}
    />
  );
}
