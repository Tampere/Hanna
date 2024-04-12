import { AddSharp, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Card, IconButton, Typography, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Fragment } from 'react';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Code, CodeId } from 'tre-hanna-shared/src/schema/code';
import { ProjectObjectUserRole } from 'tre-hanna-shared/src/schema/projectObject';

import { trpc } from '@frontend/client';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { RoleSelect } from '@frontend/components/forms/RoleSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { langAtom, useTranslations } from '@frontend/stores/lang';

interface Props {
  value: ProjectObjectUserRole[];
  readOnly: boolean;
  onChange: ControllerRenderProps<FieldValues, string>['onChange'];
}

export function ProjectObjectFormUserRoles({ value, readOnly, onChange }: Props) {
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const codes = trpc.code.get.useQuery(
    { codeListId: 'KohdeKayttajaRooli' },
    { staleTime: 60 * 60 * 1000 },
  );

  const assignedRoleIds = value.map((role: { roleId: string; userIds: string[] }) => role.roleId);

  const unassignedRoles = codes.data?.filter((code) => !assignedRoleIds.includes(code.id.id)) ?? [];

  function getCode(id: string) {
    return codes.data?.find((code) => code.id.id === id);
  }

  function getLabel(code: Code) {
    return code.text[lang];
  }

  function handleRoleSelect(newRoleId: CodeId['id'] | null, oldRoleId: CodeId['id']) {
    onChange(
      value.map((role) => (role.roleId === oldRoleId ? { ...role, roleId: newRoleId } : role)),
    );
  }

  function handleAssigneeSelect(newUsers: string[], newContacts: string[], roleId: string) {
    onChange(
      value.map((role) =>
        role.roleId === roleId
          ? { ...role, userIds: newUsers, companyContactIds: newContacts }
          : role,
      ),
    );
  }

  function handleDeleteRole(roleId: string) {
    onChange(value.filter((role) => role.roleId !== roleId));
  }

  function handleRoleAddition() {
    onChange([...value, { roleId: unassignedRoles[0].id.id, userIds: [] }]);
  }

  return (
    <Card
      variant="outlined"
      css={css`
        margin-top: 1rem;
        padding: 0.75rem;
      `}
    >
      <SectionTitle title={tr('projectObjectForm.roles')} />
      <Box
        css={css`
          padding-top: 0.25rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
        `}
      >
        {value?.length === 0 && readOnly ? (
          <Typography>{tr('projectObjectForm.noRoles')}</Typography>
        ) : (
          value?.map(
            (role: { roleId: string; userIds: string[]; companyContactIds: string[] }, idx) => {
              const codeObject = getCode(role.roleId);
              const displayBottomBorder = idx !== value?.length - 1 && readOnly;
              if (!codeObject) return null;

              return (
                <Fragment key={role.roleId}>
                  <Box
                    css={css`
                      grid-column: 1 / 2;
                      display: flex;
                      padding: 0.5rem 0.25rem;
                      align-items: top;
                      border-bottom: ${displayBottomBorder && '1px solid lightgray'};
                      & .MuiAutocomplete-root {
                        flex: 1;
                        min-width: 200px;
                      }
                    `}
                  >
                    {readOnly ? (
                      <Typography
                        css={css`
                          font-weight: 500;
                          color: #777777;
                        `}
                        key={role.roleId}
                      >
                        {getLabel(codeObject)}:
                      </Typography>
                    ) : (
                      <CodeSelect
                        disableClearable
                        readOnly={readOnly}
                        options={[codeObject, ...unassignedRoles]}
                        value={role.roleId}
                        multiple={false}
                        onChange={(newRoleId) => handleRoleSelect(newRoleId, role.roleId)}
                        codeListId="KohdeKayttajaRooli"
                      />
                    )}
                  </Box>
                  <Box
                    css={css`
                      grid-column: 2 / 3;
                      padding: 0.5rem 0.25rem;
                      display: flex;
                      border-bottom: ${displayBottomBorder && '1px solid lightgray'};
                      align-items: center;
                      & .MuiAutocomplete-root {
                        flex: 1;
                        max-width: 215px;
                        padding-right: 0;
                      }
                      & .MuiInputBase-root {
                        padding-right: 0;
                      }
                    `}
                  >
                    <RoleSelect
                      multiple
                      id={'rooli'}
                      value={{ userIds: role.userIds, companyContactIds: role.companyContactIds }}
                      onChange={(userIds, companyContactIds) =>
                        handleAssigneeSelect(userIds, companyContactIds, role.roleId)
                      }
                      readOnly={readOnly}
                    />
                    {!readOnly && (
                      <IconButton
                        size="small"
                        css={css`
                          margin-left: auto;
                        `}
                        onClick={() => handleDeleteRole(role.roleId)}
                      >
                        <DeleteOutline />
                      </IconButton>
                    )}
                  </Box>
                </Fragment>
              );
            },
          )
        )}
      </Box>
      {!readOnly && (
        <Button
          disabled={unassignedRoles?.length === 0}
          css={css`
            font-style: italic;
            text-transform: none;
          `}
          startIcon={<AddSharp />}
          onClick={handleRoleAddition}
        >
          {tr('projectObjectForm.newRole')}
        </Button>
      )}
    </Card>
  );
}
