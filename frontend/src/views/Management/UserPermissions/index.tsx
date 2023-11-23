import { SaveSharp, SearchTwoTone } from '@mui/icons-material';
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

import { trpc } from '@frontend/client';
import { useTranslations } from '@frontend/stores/lang';

export function UserPermissionsPage() {
  const tr = useTranslations();
  const query = trpc.userPermissions.getAll.useQuery();

  if (query === undefined || query.data === undefined) {
    return;
  }

  let userPermissions = query.data
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
      };
    });

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
          <Button variant="contained" endIcon={<SaveSharp />} disabled>
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
      />
      <TableContainer
        css={css`
          margin-top: 32px;
        `}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tr('userPermissions.userName')}</TableCell>
              <TableCell align="center">{tr('userPermissions.investmentProject.write')}</TableCell>
              <TableCell align="center">{tr('userPermissions.detailplanProject.write')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userPermissions.map((user) => (
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
                    checked={user.isAdmin || user.permissions.includes('investmentProject.write')}
                    disabled={user.isAdmin}
                  />
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={user.isAdmin || user.permissions.includes('detailplanProject.write')}
                    disabled={user.isAdmin}
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
