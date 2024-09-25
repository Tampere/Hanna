import { css } from '@emotion/react';
import { SearchTwoTone } from '@mui/icons-material';
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useSetAtom } from 'jotai';
import diff from 'microdiff';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useNavigationBlocker } from '@frontend/stores/navigationBlocker';
import { dirtyViewsAtom } from '@frontend/stores/projectView';

import { ProjectWritePermission } from '@shared/schema/project/base';

interface Props {
  projectId: string;
  editing: boolean;
  ownerId?: string;
}

export const ProjectPermissions = forwardRef(function ProjectPermissions(
  { projectId, editing, ownerId }: Props,
  ref,
) {
  const notify = useNotifications();
  const tr = useTranslations();

  const {
    data: userPermissions,
    isLoading,
    isError,
    refetch,
  } = trpc.project.getPermissions.useQuery({ projectId: projectId, withAdmins: true });

  const permissionsUpdate = trpc.project.updatePermissions.useMutation();
  const [searchterm, setSearchterm] = useState('');
  const [localUserPermissions, setLocalUserPermissions] = useState<ProjectWritePermission[]>([]);
  const setDirtyViews = useSetAtom(dirtyViewsAtom);

  const isDirty =
    !isLoading && !isError && diff(userPermissions, localUserPermissions).length !== 0;
  useNavigationBlocker(isDirty, 'projectPermissions', () =>
    setDirtyViews((prev) => ({ ...prev, permissions: false })),
  );

  useImperativeHandle(
    ref,
    () => ({
      onSave: handleUpdatePermissions,
      onCancel: handleCancelChanges,
    }),
    [userPermissions, localUserPermissions],
  );

  useEffect(() => {
    if (!isLoading && !isError)
      setDirtyViews((prev) => ({
        ...prev,
        permissions: diff(userPermissions, localUserPermissions).length !== 0,
      }));
  }, [localUserPermissions]);

  useEffect(() => {
    if (userPermissions) setLocalUserPermissions([...userPermissions]);
  }, [userPermissions]);

  function handleCancelChanges() {
    setLocalUserPermissions([...(userPermissions ?? [])]);
  }

  function handleUpdatePermissions() {
    if (!userPermissions) return;
    const changedUserIds = diff(userPermissions, localUserPermissions).reduce((ids, diff) => {
      const userId = localUserPermissions[diff.path[0] as number].userId;
      if (userId in ids) return ids;
      return [...ids, userId];
    }, [] as string[]);

    const permissionsToUpdate = localUserPermissions
      .map((user) => ({
        userId: user.userId,
        canWrite: user.canWrite,
      }))
      .filter((userPermission) => changedUserIds.includes(userPermission.userId));
    const updatePayload = {
      projectId: projectId,
      permissions: permissionsToUpdate,
    };

    permissionsUpdate.mutate(updatePayload, {
      onError: () => {
        notify({ severity: 'error', title: tr('genericForm.notifySubmitFailure') });
      },
      onSuccess: () => {
        notify({
          severity: 'success',
          title: tr('projectPermissions.notifyPermissionsUpdated'),
          duration: 3000,
        });
        refetch();
      },
    });
  }

  return !projectId ? null : (
    <Box>
      <Box
        css={css`
          position: sticky;
          top: 0;
          display: flex;
          background-color: white;
          z-index: 200;
          justify-content: space-between;
          align-items: center;
        `}
      >
        <TextField
          css={css`
            flex: 1;
          `}
          variant="outlined"
          size="small"
          placeholder={tr('userPermissions.filterPlaceholder')}
          value={searchterm}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchTwoTone />
              </InputAdornment>
            ),
          }}
          onChange={(event) => setSearchterm(event.target.value)}
        />
      </Box>

      <TableContainer
        css={css`
          margin-top: 32px;
        `}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tr('userPermissions.userName')}</TableCell>
              <TableCell align="center">{tr('projectPermissions.editPermission')}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2}>
                  {tr('loading')} <CircularProgress size={'1rem'} />
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={2}>
                  <Alert severity="error">{tr('unknownError')}</Alert>
                </TableCell>
              </TableRow>
            ) : (
              localUserPermissions
                .filter((user) => user.userName.toLowerCase().includes(searchterm.toLowerCase()))
                .map((user) => (
                  <TableRow key={user.userId} hover={true}>
                    <TableCell
                      component="th"
                      variant="head"
                      scope="row"
                      css={css`
                        ${(user.userId === ownerId || user.isAdmin) && 'color: grey'};
                      `}
                    >
                      {user.userName}
                      {user.userId === ownerId
                        ? ` (${tr('project.ownerLabel')})`
                        : user.isAdmin
                          ? ` (${tr('project.adminLabel')})`
                          : ''}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        onChange={() =>
                          setLocalUserPermissions((prevUsers) =>
                            prevUsers.map((prevUser) =>
                              prevUser.userId === user.userId
                                ? { ...prevUser, canWrite: !prevUser.canWrite }
                                : prevUser,
                            ),
                          )
                        }
                        checked={user.userId === ownerId || user.canWrite || user.isAdmin}
                        disabled={!editing || user.userId === ownerId || user.isAdmin}
                      />
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});
