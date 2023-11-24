import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

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
    userName: 'Test User',
    canEdit: false,
  },
  {
    userId: '12346',
    userName: 'Test User 2',
    canEdit: true,
  },
  {
    userId: '12347',
    userName: 'Test User 3',
    canEdit: true,
  },
  {
    userId: '12348',
    userName: 'Test User 4',
    canEdit: false,
  },
  {
    userId: '12349',
    userName: 'Test User 6',
    canEdit: false,
  },
  {
    userId: '12350',
    userName: 'Test User 5',
    canEdit: false,
  },
];

export function ProjectPermissions(props: Props) {
  const { projectId } = props;
  const notify = useNotifications();
  const tr = useTranslations();

  return !projectId ? null : (
    <Box>
      <Box
        css={css`display: flex; justify-content: space-between; align-items: center;`}>
        <TextField
        variant="outlined"
        size="small"
        placeholder={tr('userPermissions.filterPlaceholder')}
        InputProps={{startAdornment: (
          <InputAdornment position="start">
            <SearchTwoTone />
          </InputAdornment>)}}
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
            {userPermissions.map((user) => (
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
