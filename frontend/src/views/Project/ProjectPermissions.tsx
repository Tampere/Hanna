import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { trpc } from '@frontend/client';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { getRange } from '@frontend/utils/array';

import { DbInvestmentProject } from '@shared/schema/project/investment';
import { css } from '@emotion/react';
import { Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Typography, Checkbox, InputAdornment, TextField, Button } from '@mui/material';
import { SaveSharp, SearchTwoTone } from '@mui/icons-material';

interface Props {
  projectId: string;
}

let userPermissions = [
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
  const notify = useNotifications();
  const tr = useTranslations();

  const [searchterm, setSearchterm] = useState("");
  const [users, setUsers] = useState(userPermissions);

  return !projectId ? null : (
    <Box>
      <Box
        css={css`display: flex; justify-content: space-between; align-items: center;`}>
        <TextField
          variant="outlined"
          size="small"
          placeholder={tr('userPermissions.filterPlaceholder')}
          value={searchterm}
          InputProps={{startAdornment: (
          <InputAdornment position="start">
            <SearchTwoTone />
          </InputAdornment>)}}
          onChange={(event => setSearchterm(event.target.value))}
        />
        <Button
          css={css`height: max-content;`}
          size="small"
          variant="contained"
          endIcon={<SaveSharp />}
          disabled
        >
          {tr('genericForm.saveChanges')}
        </Button>
      </Box>

      <TableContainer
        css={css`margin-top: 32px;`}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                {tr('userPermissions.userName')}
              </TableCell>
              <TableCell align="center">
                {tr('projectPermissions.editPermission')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.filter(user => user.userName.toLowerCase().includes(searchterm.toLowerCase()))
            .map((user) => (
              <TableRow key={user.userId} hover={true}>
                <TableCell component="th" variant="head" scope="row">
                  {user.userName}
                </TableCell>
                <TableCell align="center">
                  <Checkbox checked={user.canEdit} />
                </TableCell>
              </TableRow>)
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
