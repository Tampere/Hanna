import { SaveSharp, SearchTwoTone, Undo } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  css,
} from '@mui/material';
import diff from 'microdiff';
import { useEffect, useMemo, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { useDebounce } from '@frontend/utils/useDebounce';

import { hasPermission } from '@shared/schema/userPermissions';
import { debounce } from '@shared/utils';

export function UserPermissionsPage() {
  const tr = useTranslations();
  const [userSearch, setUserSearch] = useState('');
  const { data, isLoading, isError, refetch } = trpc.userPermissions.getByName.useQuery({
    userName: useDebounce(userSearch, 500),
  });
  const [localUserPermissions, setLocalUserPermissions] = useState<typeof userPermissions>([]);
  const updateData = trpc.userPermissions.setPermissions.useMutation();
  const notify = useNotifications();

  const debouncedSearch = useMemo(() => debounce(refetch, 500), []);

  useEffect(() => {
    if (userSearch) {
      debouncedSearch();
    }
  }, [userSearch]);

  const userPermissions = data
    ? [...data]
        .sort((a, b) => {
          if (a.isAdmin !== b.isAdmin) {
            return a.isAdmin ? -1 : 1; // List the admins first
          } else {
            return a.userName.localeCompare(b.userName);
          }
        })
        .map((user) => {
          return {
            userId: user.userId,
            userName: user.userName,
            isAdmin: user.isAdmin,
            permissions: user.permissions,
            userEmail: user.userEmail,
            userRole: user.userRole,
          };
        })
    : [];

  function handlePermissionChange(
    user: (typeof userPermissions)[number],
    permission: (typeof user.permissions)[number],
  ) {
    if (!permission) return;
    setLocalUserPermissions((prevPermissions) =>
      prevPermissions.map((prevUser) =>
        prevUser.userId === user.userId
          ? {
              ...prevUser,
              permissions: prevUser.permissions?.includes(permission)
                ? prevUser.permissions.filter((perm) => perm !== permission)
                : [...(prevUser.permissions ?? []), permission],
            }
          : prevUser,
      ),
    );
  }

  function updatePermissions() {
    const changedUserIds = diff(userPermissions, localUserPermissions).reduce((ids, diff) => {
      const userId = localUserPermissions[diff.path[0] as number].userId;
      if (userId in ids) return ids;
      return [...ids, userId];
    }, [] as string[]);

    const usersToUpdate = localUserPermissions
      .filter((user) => changedUserIds.includes(user.userId))
      .map((user) => ({ userId: user.userId, permissions: user.permissions }));

    updateData.mutate(usersToUpdate, {
      onError: () =>
        notify({
          severity: 'error',
          title: tr('genericForm.notifySubmitFailure'),
          duration: 3000,
        }),
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

  useEffect(() => {
    setLocalUserPermissions(userPermissions);
  }, [data]);

  return (
    <Box
      css={css`
        padding: 16px;
      `}
    >
      <Box
        css={css`
          display: flex;
          justify-content: space-between;
          margin-bottom: 24px;
          align-items: center;
        `}
      >
        <Typography variant="h4" component="h1">
          {tr('management.tabs.userPermissions')}
        </Typography>
        <Box
          css={css`
            display: flex;
            gap: 8px;
            height: max-content;
          `}
        >
          <Button
            type="reset"
            color="secondary"
            variant="outlined"
            endIcon={<Undo />}
            disabled={
              localUserPermissions.length === 0 ||
              diff(userPermissions, localUserPermissions).length === 0
            }
            onClick={() => setLocalUserPermissions(userPermissions)}
          >
            {tr('genericForm.cancelAll')}
          </Button>
          <Button
            variant="contained"
            endIcon={<SaveSharp />}
            disabled={
              localUserPermissions.length === 0 ||
              diff(userPermissions, localUserPermissions).length === 0
            }
            onClick={updatePermissions}
          >
            {tr('genericForm.saveChanges')}
          </Button>
        </Box>
      </Box>
      <TextField
        variant="outlined"
        size="medium"
        fullWidth={true}
        placeholder={tr('userPermissions.filterPlaceholder')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchTwoTone />
            </InputAdornment>
          ),
        }}
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
      />
      {!isLoading &&
        !isError &&
        (userPermissions?.length > 0 ? (
          <TableContainer
            css={css`
              margin-top: 32px;
            `}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tr('userPermissions.userName')}</TableCell>
                  <TableCell align="center">
                    {tr('userPermissions.investmentProject.write')}
                  </TableCell>
                  <TableCell align="center">
                    {tr('userPermissions.detailplanProject.write')}
                  </TableCell>
                  <TableCell align="center">{tr('userPermissions.financials.write')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {localUserPermissions.map((user) => (
                  <TableRow key={user.userId} hover={true}>
                    <TableCell component="th" variant="head" scope="row">
                      {user.userName}
                      {user.isAdmin && (
                        <Typography
                          variant="body2"
                          component="span"
                          css={css`
                            opacity: 0.7;
                          `}
                        >
                          &nbsp;({tr('userPermissions.admin')})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={hasPermission(user, 'investmentProject.write')}
                        disabled={user.isAdmin}
                        onClick={() => handlePermissionChange(user, 'investmentProject.write')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={hasPermission(user, 'detailplanProject.write')}
                        disabled={user.isAdmin}
                        onClick={() => handlePermissionChange(user, 'detailplanProject.write')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        checked={hasPermission(user, 'financials.write')}
                        disabled={user.isAdmin}
                        onClick={() => handlePermissionChange(user, 'financials.write')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography
            css={css`
              margin-top: 3rem;
              text-align: center;
            `}
          >
            {tr('userPermissions.noUsersFound')}
          </Typography>
        ))}
    </Box>
  );
}
