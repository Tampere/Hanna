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
import diff from 'microdiff';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
  ownerId?: string;
}

export function ProjectPermissions({ projectId, ownerId }: Props) {
  const notify = useNotifications();
  const tr = useTranslations();
  const {
    data: userPermissions,
    isLoading,
    isError,
    refetch,
  } = trpc.project.getPermissions.useQuery({ projectId: projectId, withAdmins: false });
  const permissionsUpdate = trpc.project.updatePermissions.useMutation();
  const [searchterm, setSearchterm] = useState('');
  const [localSortedUserPermissions, setLocalSortedUserPermissions] = useState<
    typeof sortedUserPermissions
  >([]);

  const sortedUserPermissions = userPermissions
    ? [...userPermissions]?.sort((a, b) => {
        if (a.userId === ownerId) return -1;
        if (b.userId === ownerId) return 1;
        if (a.canWrite !== b.canWrite) {
          return a.canWrite ? -1 : 1; // List those with edit rights first
        } else {
          return a.userName.localeCompare(b.userName);
        }
      })
    : [];

  useEffect(() => {
    setLocalSortedUserPermissions(sortedUserPermissions);
  }, [userPermissions]);

  function handleUpdatePermissions() {
    const changedUserIds = diff(sortedUserPermissions, localSortedUserPermissions).reduce(
      (ids, diff) => {
        const userId = localSortedUserPermissions[diff.path[0] as number].userId;
        if (userId in ids) return ids;
        return [...ids, userId];
      },
      [] as string[],
    );

    const permissionsToUpdate = localSortedUserPermissions
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
              localSortedUserPermissions.length === 0 ||
              diff(sortedUserPermissions, localSortedUserPermissions).length === 0
            }
            onClick={() => setLocalSortedUserPermissions(sortedUserPermissions)}
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
              localSortedUserPermissions.length === 0 ||
              diff(sortedUserPermissions, localSortedUserPermissions).length === 0
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
              localSortedUserPermissions
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
                          setLocalSortedUserPermissions((prevUsers) =>
                            prevUsers.map((prevUser) =>
                              prevUser.userId === user.userId
                                ? { ...prevUser, canWrite: !prevUser.canWrite }
                                : prevUser,
                            ),
                          )
                        }
                        checked={user.userId === ownerId || user.canWrite}
                        disabled={user.userId === ownerId}
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
