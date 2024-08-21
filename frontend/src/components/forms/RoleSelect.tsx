import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';
import { Box, Checkbox, Typography, css } from '@mui/material';
import { useMemo } from 'react';

import { trpc } from '@frontend/client';

import type { User } from '@shared/schema/user';

import { MultiSelect } from './MultiSelect';

function AssigneeSelectionLabel({
  assigneeId,
  roleOptions,
}: {
  assigneeId: string | null;
  roleOptions: RoleAssignee[];
}) {
  const assignee = roleOptions.find((assignee) => assignee.id === assigneeId);
  if (!assignee) {
    return '';
  }
  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        overflow: hidden;
      `}
    >
      <span
        css={css`
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
      >
        {assignee.name}
      </span>
      <span
        css={css`
          font-size: 12px;
          line-height: 12px;
          color: #00000099;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
      >
        {assignee.companyName}
      </span>
    </Box>
  );
}

function ChipLabelElement({
  assigneeId,
  roleOptions,
}: {
  assigneeId: string | null;
  roleOptions: RoleAssignee[];
}) {
  const assignee = roleOptions.find((assignee) => assignee.id === assigneeId);
  if (!assignee) {
    return '';
  }
  return (
    <Typography
      css={css`
        font-size: 12px;
        line-height: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      `}
    >
      {assignee.name}
      <br />
      <span
        css={css`
          font-size: 10px;
          color: #00000099;
        `}
      >
        {assignee.companyName}
      </span>
    </Typography>
  );
}

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

interface RoleAssignee extends Omit<User, 'email'> {
  email?: string;
  companyName?: string;
}

export function RoleSelect(props: Props) {
  const { id, readOnly, onBlur, multiple, value, onChange, maxTags } = props;
  const users = trpc.user.getAllNonExt.useQuery();
  const companyContacts = trpc.company.getAllContactsAndCompanies.useQuery();

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
        companyName: contact.companyName,
        name: contact.contactName,
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
      <ul
        css={css`
          list-style: none;
          padding-inline-start: 10px;
          margin: 0;
          overflow: hidden;
        `}
      >
        {(selection as RoleAssignee[]).map((assignee: RoleAssignee) => (
          <li
            title={`${assignee.name}${assignee.companyName ? `, ${assignee.companyName}` : ''}`}
            css={css`
              margin-bottom: 8px;
            `}
            key={assignee.id}
          >
            <span
              css={css`
                display: block;
                font-size: 14px;
                line-height: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {assignee.name}
            </span>
            <span
              css={css`
                display: block;
                font-size: 12px;
                color: #00000099;
                line-height: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {assignee.companyName}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <Typography>
        {(selection as RoleAssignee)?.name}
        <br />
        <span>{(selection as RoleAssignee)?.companyName}</span>
      </Typography>
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
      onChange={(selectedAssignees) => {
        onChange(
          selectedAssignees
            .filter((assignee) => !assignee?.companyName)
            .map((assignee) => assignee.id),
          selectedAssignees
            .filter((assignee) => assignee?.companyName)
            .map((assignee) => assignee.id),
        );
      }}
      renderOption={(props, id, { selected }) => (
        <li {...props} style={{ hyphens: 'auto' }} key={id}>
          {multiple && (
            <Checkbox
              icon={<CheckBoxOutlineBlank fontSize="small" />}
              checkedIcon={<CheckBox fontSize="small" />}
              sx={{ mr: 1 }}
              checked={selected}
            />
          )}
          <AssigneeSelectionLabel assigneeId={id} roleOptions={roleOptions} />
        </li>
      )}
      optionLabelElement={(assigneeId) => (
        <ChipLabelElement assigneeId={assigneeId} roleOptions={roleOptions} />
      )}
      getOptionLabel={(assignee) =>
        `${assignee.name}${assignee.companyName ? `, ${assignee.companyName}` : ''}`
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
      renderOption={(props, id, { selected }) => (
        <li {...props} style={{ hyphens: 'auto' }} key={id}>
          {multiple && (
            <Checkbox
              icon={<CheckBoxOutlineBlank fontSize="small" />}
              checkedIcon={<CheckBox fontSize="small" />}
              sx={{ mr: 1 }}
              checked={selected}
            />
          )}
          <AssigneeSelectionLabel assigneeId={id} roleOptions={roleOptions} />
        </li>
      )}
      optionLabelElement={(assigneeId) => (
        <ChipLabelElement assigneeId={assigneeId} roleOptions={roleOptions} />
      )}
      getOptionLabel={(assignee) =>
        `${assignee.name}${assignee.companyName ? `, ${assignee.companyName}` : ''}`
      }
      onChange={(assignee) => onChange(assignee?.id ?? null)}
      multiple={false}
    />
  );
}
