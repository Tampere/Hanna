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
import { useState } from 'react';

import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

interface Props {
  projectId: string;
}

const userPermissions = [
  {
    userId: '12345',
    userName: 'Pekkari Jouko',
    canEdit: false,
  },
  {
    userId: '12346',
    userName: 'Paavola Pirjo',
    canEdit: true,
  },
  {
    userId: '12347',
    userName: 'Nokkonen Juhani',
    canEdit: true,
  },
  {
    userId: '12348',
    userName: 'Tiainen Tiina',
    canEdit: false,
  },
  {
    userId: '12349',
    userName: 'Aakkula Aatu',
    canEdit: false,
  },
  {
    userId: '12350',
    userName: 'Perttilä Johannes',
    canEdit: false,
  },
].sort((a, b) => {
  if (a.canEdit !== b.canEdit) {
    return a.canEdit ? -1 : 1; // List those with edit rights first
  } else {
    return a.userName.localeCompare(b.userName);
  }
});

export function ProjectPermissions(props: Props) {
  const { projectId } = props;
  //const notify = useNotifications();
  const tr = useTranslations();

  const [searchterm, setSearchterm] = useState('');
  const [users, setUsers] = useState(userPermissions);

  function handleUpdatePermissions() {
    const usersToUpdate = users.filter((user) => user.canEdit).map((user) => user.userId);

    console.log(usersToUpdate);
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
            disabled={users.length === 0 || diff(userPermissions, users).length === 0}
            onClick={() => setUsers(userPermissions)}
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
            disabled={users.length === 0 || diff(userPermissions, users).length === 0}
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
            {users
              .filter((user) => user.userName.toLowerCase().includes(searchterm.toLowerCase()))
              .map((user) => (
                <TableRow key={user.userId} hover={true}>
                  <TableCell component="th" variant="head" scope="row">
                    {user.userName}
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      onChange={() =>
                        setUsers((prevUsers) =>
                          prevUsers.map((prevUser) =>
                            prevUser.userId === user.userId
                              ? { ...prevUser, canEdit: !prevUser.canEdit }
                              : prevUser
                          )
                        )
                      }
                      checked={user.canEdit}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
