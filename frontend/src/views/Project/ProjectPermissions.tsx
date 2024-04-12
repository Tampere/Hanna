import { css } from '@emotion/react';
import { SaveSharp, SearchTwoTone, Undo } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
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
import { useAtomValue } from 'jotai';
import diff from 'microdiff';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

import { ProjectWritePermission } from '@shared/schema/project/base';
import { ownsProject } from '@shared/schema/userPermissions';

interface Props {
  projectId: string;
  ownerId?: string;
}

export function ProjectPermissions({ projectId, ownerId }: Props) {
  const notify = useNotifications();
  const tr = useTranslations();
  const user = useAtomValue(asyncUserAtom);
  const {
    data: userPermissions,
    isLoading,
    isError,
    refetch,
  } = trpc.project.getPermissions.useQuery({ projectId: projectId, withAdmins: false });

  const permissionsUpdate = trpc.project.updatePermissions.useMutation();
  const [searchterm, setSearchterm] = useState('');
  const [localUserPermissions, setLocalUserPermissions] = useState<ProjectWritePermission[]>([]);

  const isProjectOwner = ownsProject(user, { owner: ownerId ?? '', writeUsers: [] });

  useEffect(() => {
    if (userPermissions) setLocalUserPermissions([...userPermissions]);
  }, [userPermissions]);

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
          title: tr('genericForm.notifySubmitSuccess'),
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
          display: flex;
          @media screen and (max-width: 1150px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          justify-content: space-between;
          align-items: center;
        `}
      >
        <TextField
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
        <Box
          css={css`
            display: flex;
            gap: 0.5rem;
            @media screen and (width > 1150px) {
              margin-left: auto;
            }
          `}
        >
          <Button
            size="small"
            type="reset"
            color="secondary"
            variant="outlined"
            endIcon={<Undo />}
            disabled={
              isLoading ||
              isError ||
              !isProjectOwner ||
              localUserPermissions.length === 0 ||
              diff(userPermissions, localUserPermissions).length === 0
            }
            onClick={() => setLocalUserPermissions([...(userPermissions ?? [])])}
          >
            {tr('genericForm.cancelAll')}
          </Button>
          <Button
            css={css`
              height: max-content;
            `}
            size="small"
            variant="contained"
            endIcon={<SaveSharp />}
            disabled={
              isLoading ||
              isError ||
              !isProjectOwner ||
              localUserPermissions.length === 0 ||
              diff(userPermissions, localUserPermissions).length === 0
            }
            onClick={() => handleUpdatePermissions()}
          >
            {tr('genericForm.saveChanges')}
          </Button>
        </Box>
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
                        ${user.userId === ownerId && 'color: grey'};
                      `}
                    >
                      {user.userName}
                      {user.userId === ownerId ? ` (${tr('project.ownerLabel')})` : ''}
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
                        checked={user.userId === ownerId || user.canWrite}
                        disabled={!isProjectOwner || user.userId === ownerId}
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
}
