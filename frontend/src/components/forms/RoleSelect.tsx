import { Typography } from '@mui/material';
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
      value: { userIds: string[]; companyContactIds: string[] };
      onChange: (userIds: string[], companyContactIds: string[]) => void;
      maxTags?: number;
    }
  | {
      multiple?: false;
      value: string;
      onChange: (assigneeId: string | null) => void;
      maxTags?: never;
    }
);

interface RoleAssignee extends User {
  external?: boolean;
}

export function RoleSelect(props: Props) {
  const { id, readOnly, onBlur, multiple, value, onChange, maxTags } = props;
  const users = trpc.user.getAllNonExt.useQuery();
  const companyContacts = trpc.company.getAllContacts.useQuery();

  function getAssignees(assignees: { userIds: string[]; companyContactIds: string[] }) {
    return roleOptions.filter(
      (assigneeOption) =>
        assignees.userIds?.includes(assigneeOption.id) ||
        assignees.companyContactIds?.includes(assigneeOption.id),
    );
  }

  function getAssignee(assigneeId: string) {
    return roleOptions.find((assignee: RoleAssignee) => assignee.id === assigneeId);
  }

  const roleOptions = useMemo(() => {
    const userData = users.data ?? [];
    const contactsData = companyContacts.data ?? [];
    return [
      ...userData,
      ...contactsData.map((contact) => ({
        id: contact.id,
        email: contact.emailAddress,
        name: contact.contactName,
        external: true,
      })),
    ] as RoleAssignee[];
  }, [users.data, companyContacts.data]);

  const selection = useMemo(() => {
    if (!value) {
      return multiple ? [] : null;
    }
    return multiple ? getAssignees(value) : getAssignee(value);
  }, [multiple, value, users.data, companyContacts.data]);

  if (readOnly) {
    if (!selection) {
      return '-';
    }

    return multiple ? (
      <Typography>
        {(selection as RoleAssignee[]).map((assignee: RoleAssignee, idx) => (
          <span key={assignee.id}>
            {assignee.name}
            {(selection as RoleAssignee[]).length - 1 !== idx && ','}
            &nbsp;
          </span>
        ))}
      </Typography>
    ) : (
      <Typography>{(selection as RoleAssignee)?.name}</Typography>
    );
  }

  return multiple ? (
    <MultiSelect
      disableClearable={true}
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      loading={users.isLoading || companyContacts.isLoading}
      value={selection as RoleAssignee[]}
      options={roleOptions}
      getOptionId={(assignee) => assignee.id}
      getOptionLabel={(assignee) => `${assignee.name} ${assignee?.external ? '(ulkoinen)' : ''}`}
      onChange={(selectedAssignees) =>
        onChange(
          selectedAssignees
            .filter((assignee) => !assignee?.external)
            .map((assignee) => assignee.id),
          selectedAssignees.filter((assignee) => assignee?.external).map((assignee) => assignee.id),
        )
      }
      maxTags={maxTags}
      multiple
    />
  ) : (
    <MultiSelect
      disableClearable={true}
      id={id}
      readOnly={readOnly}
      onBlur={onBlur}
      loading={users.isLoading || companyContacts.isLoading}
      value={selection as RoleAssignee}
      options={roleOptions}
      getOptionId={(assignee) => assignee.id}
      getOptionLabel={(assignee) => assignee.name}
      onChange={(assignee) => onChange(assignee?.id ?? null)}
      multiple={false}
    />
  );
}
