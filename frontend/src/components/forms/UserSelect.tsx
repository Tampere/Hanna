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
      maxTags?: number;
    }
  | {
      multiple?: false;
      value: string;
      onChange: (userId: string | null) => void;
      maxTags?: never;
    }
);

export function UserSelect(props: Props) {
  const { id, readOnly, onBlur, multiple, value, onChange, maxTags } = props;
  const users = trpc.user.getAllNonExt.useQuery();

  function getUser(userId: string) {
    return users.data?.find((user) => user.id === userId);
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
      onChange={(selectedUsers) => onChange(selectedUsers.map((user) => user.id))}
      maxTags={maxTags}
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
