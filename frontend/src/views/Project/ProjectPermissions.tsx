import { css } from '@emotion/react';
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
} from '@mui/material';
import diff from 'microdiff';
import { useEffect, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
}

export function ProjectPermissions(props: Props) {
  const { projectId } = props;
  const notify = useNotifications();
  const tr = useTranslations();
  const {
    data: userPermissions,
    isLoading,
    isError,
    refetch,
  } = trpc.project.getPermissions.useQuery({ projectId: projectId });
  const permissionsUpdate = trpc.project.updatePermissions.useMutation();
  const [searchterm, setSearchterm] = useState('');
  const [localSortedUserPermissions, setLocalSortedUserPermissions] = useState<
    typeof sortedUserPermissions
  >([]);

  const sortedUserPermissions = userPermissions
    ? [...userPermissions]?.sort((a, b) => {
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
    const permissionsToUpdate = localSortedUserPermissions.map((user) => ({
      userId: user.userId,
      projectId: projectId,
      canWrite: user.canWrite,
    }));
    permissionsUpdate.mutate(permissionsToUpdate, {
      onError: () => {
        notify({ severity: 'error', title: 'test', duration: 3000 });
      },
      onSuccess: () => {
        notify({ severity: 'success', title: 'test', duration: 3000 });
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
            type="reset"
            color="secondary"
            variant="outlined"
            endIcon={<Undo />}
            disabled={
              isLoading ||
              isError ||
              localSortedUserPermissions.length === 0 ||
              diff(userPermissions, localSortedUserPermissions).length === 0
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
                <TableCell colSpan={2}>loading...</TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={2}>error...</TableCell>
              </TableRow>
            ) : (
              localSortedUserPermissions
                .filter((user) => user.userName.toLowerCase().includes(searchterm.toLowerCase()))
                .map((user) => (
                  <TableRow key={user.userId} hover={true}>
                    <TableCell component="th" variant="head" scope="row">
                      {user.userName}
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        onChange={() =>
                          setLocalSortedUserPermissions((prevUsers) =>
                            prevUsers.map((prevUser) =>
                              prevUser.userId === user.userId
                                ? { ...prevUser, canWrite: !prevUser.canWrite }
                                : prevUser
                            )
                          )
                        }
                        checked={user.canWrite}
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
