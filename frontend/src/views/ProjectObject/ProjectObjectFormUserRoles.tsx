import { AddSharp, DeleteOutline } from '@mui/icons-material';
import { Box, Button, Card, IconButton, Typography, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { PropsWithChildren } from 'react';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { trpc } from '@frontend/client';
import { CodeSelect } from '@frontend/components/forms/CodeSelect';
import { RoleSelect } from '@frontend/components/forms/RoleSelect';
import { SectionTitle } from '@frontend/components/forms/SectionTitle';
import { langAtom, useTranslations } from '@frontend/stores/lang';

import { Code, CodeId } from '@shared/schema/code';
import { ProjectObjectUserRole } from '@shared/schema/projectObject/base';

const leftColumnStyle = (displayBottomBorder: boolean) => css`
  grid-column: 1 / 2;
  display: flex;
  padding: 0.75rem 0.25rem;
  align-items: center;
  border-bottom: ${displayBottomBorder && '1px solid lightgray'};
  & .MuiAutocomplete-root {
    flex: 1;
    min-width: 200px;
  }
`;

const rightColumnStyle = (displayBottomBorder: boolean, withRightPadding: boolean) => css`
  grid-column: 2 / 3;
  padding: 0.75rem 0;
  display: flex;
  border-bottom: ${displayBottomBorder && '1px solid lightgray'};
  align-items: center;
  & .MuiAutocomplete-root {
    flex: 1;
    padding-right: ${withRightPadding ? 35 : 0}px;
  }
  & .MuiInputBase-root {
    padding-right: 0;
  }
`;

interface RoleSelectGridContentWrapperProps extends PropsWithChildren {
  displayBottomBorder: boolean;
  label: string;
  readOnly: boolean;
  codeSelectOptions?: {
    value?: CodeId['id'];
    onChange: (newValue: CodeId['id'] | null) => void;
    options: Code[];
  };
}

function RoleSelectGridContentWrapper({
  displayBottomBorder,
  label,
  children,
  readOnly,
  codeSelectOptions,
}: RoleSelectGridContentWrapperProps) {
  return (
    <>
      <Box css={leftColumnStyle(displayBottomBorder)}>
        {readOnly || !codeSelectOptions ? (
          <Typography
            css={css`
              font-weight: 500;
              font-size: 16px;
              line-height: 16px;
              color: #777777;
            `}
          >
            {label}:
          </Typography>
        ) : (
          <CodeSelect
            disableClearable
            readOnly={readOnly}
            multiple={false}
            {...codeSelectOptions}
            codeListId="KohdeKayttajaRooli"
          />
        )}
      </Box>
      <Box css={rightColumnStyle(displayBottomBorder, !codeSelectOptions)}>{children}</Box>
    </>
  );
}

interface Props {
  value: ProjectObjectUserRole[];
  readOnly: boolean;
  onChange: ControllerRenderProps<FieldValues, string>['onChange'];
  forInvestment?: boolean;
}

export function ProjectObjectFormUserRoles({
  value,
  readOnly,
  onChange,
  forInvestment = false,
}: Props) {
  const tr = useTranslations();
  const lang = useAtomValue(langAtom);
  const codes = trpc.code.get.useQuery(
    { codeListId: 'KohdeKayttajaRooli' },
    { staleTime: 60 * 60 * 1000 },
  );
  const investmentCodes = forInvestment
    ? trpc.code.get.useQuery(
        { codeListId: 'InvestointiKohdeKayttajaRooli' },
        { staleTime: 60 * 60 * 1000 },
      )
    : { data: [] };

  const assignedRoleIds = value
    .filter((role) => role.roleType !== 'InvestointiKohdeKayttajaRooli')
    .map((role: { roleId: string; userIds: string[] }) => role.roleId);

  const unassignedRoles = codes.data?.filter((code) => !assignedRoleIds.includes(code.id.id)) ?? [];

  function getCode(id: string, forInvestment = false) {
    return (forInvestment ? investmentCodes.data : codes.data)?.find((code) => code.id.id === id);
  }

  function getLabel(code: Code) {
    return code.text[lang];
  }

  function handleRoleSelect(
    newRoleId: CodeId['id'] | null,
    oldRoleId: CodeId['id'],
    roleType: ProjectObjectUserRole['roleType'],
  ) {
    onChange(
      value.map((role) =>
        role.roleType === roleType && role.roleId === oldRoleId
          ? { ...role, roleId: newRoleId }
          : role,
      ),
    );
  }

  function handleAssigneeSelect(
    newUsers: string[],
    newContacts: string[],
    roleId: string,
    roleType: ProjectObjectUserRole['roleType'],
  ) {
    onChange(
      value.map((role) =>
        role.roleType === roleType && role.roleId === roleId
          ? { ...role, userIds: newUsers, companyContactIds: newContacts, roleType }
          : role,
      ),
    );
  }

  function handleDeleteRole(roleId: string, roleType: ProjectObjectUserRole['roleType']) {
    onChange(value.filter((role) => !(role.roleType === roleType && role.roleId === roleId)));
  }

  function handleRoleAddition() {
    onChange([
      ...value,
      { roleId: unassignedRoles[0].id.id, roleType: 'KohdeKayttajaRooli', userIds: [] },
    ]);
  }

  function handleInvestmentAssigneeAddition(roleId: string, newUserId: string) {
    onChange([
      ...value.filter(
        (val) => val.roleType !== 'InvestointiKohdeKayttajaRooli' || val.roleId !== roleId,
      ),
      {
        roleId,
        roleType: 'InvestointiKohdeKayttajaRooli',
        userIds: [newUserId],
        companyContactIds: [],
      },
    ]);
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
          grid-template-columns: 210px minmax(0, 1fr);
        `}
      >
        {value?.length === 0 && readOnly ? (
          <Typography>{tr('projectObjectForm.noRoles')}</Typography>
        ) : (
          <>
            {forInvestment &&
              investmentCodes.data?.map((code, idx) => {
                const codeObject = getCode(code.id.id, true);
                const role = value.find(
                  (role) =>
                    role.roleType === 'InvestointiKohdeKayttajaRooli' && role.roleId === code.id.id,
                );
                const displayBottomBorder =
                  (idx === 0 || value.some((val) => val.roleType === 'KohdeKayttajaRooli')) &&
                  readOnly;

                if (!codeObject) return null;

                return (
                  <RoleSelectGridContentWrapper
                    key={code.id.id}
                    readOnly={readOnly}
                    label={getLabel(codeObject)}
                    displayBottomBorder={displayBottomBorder}
                  >
                    <RoleSelect
                      multiple={false}
                      includeExternalUsers={false}
                      id={'rooli'}
                      value={role?.userIds[0] ?? ''}
                      onChange={(val) => {
                        if (!val) {
                          handleDeleteRole(code.id.id, 'InvestointiKohdeKayttajaRooli');
                        } else {
                          handleInvestmentAssigneeAddition(code.id.id, val);
                        }
                      }}
                      readOnly={readOnly}
                    />
                  </RoleSelectGridContentWrapper>
                );
              })}
            {value?.map((role: ProjectObjectUserRole, idx) => {
              const codeObject = getCode(role.roleId);
              const displayBottomBorder = idx !== value?.length - 1 && readOnly;
              if (!codeObject || role.roleType === 'InvestointiKohdeKayttajaRooli') return null;

              return (
                <RoleSelectGridContentWrapper
                  key={role.roleId}
                  readOnly={readOnly}
                  label={getLabel(codeObject)}
                  displayBottomBorder={displayBottomBorder}
                  codeSelectOptions={{
                    options: [codeObject, ...unassignedRoles],
                    value: role.roleId,
                    onChange: (newRoleId) =>
                      handleRoleSelect(newRoleId, role.roleId, 'KohdeKayttajaRooli'),
                  }}
                >
                  <RoleSelect
                    multiple
                    id={'rooli'}
                    value={{ userIds: role.userIds, companyContactIds: role.companyContactIds }}
                    onChange={(userIds, companyContactIds) =>
                      handleAssigneeSelect(
                        userIds,
                        companyContactIds,
                        role.roleId,
                        'KohdeKayttajaRooli',
                      )
                    }
                    readOnly={readOnly}
                  />
                  {!readOnly && (
                    <IconButton
                      size="small"
                      css={css`
                        margin-left: auto;
                      `}
                      onClick={() => handleDeleteRole(role.roleId, 'KohdeKayttajaRooli')}
                    >
                      <DeleteOutline />
                    </IconButton>
                  )}
                </RoleSelectGridContentWrapper>
              );
            })}
          </>
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
