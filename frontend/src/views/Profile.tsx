import { Box, Button, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';

import { loginAtom, logoutAtom } from '@src/stores/auth';

export function Profile() {
  const [login, performLogin] = useAtom(loginAtom);
  const [, performLogout] = useAtom(logoutAtom);

  if (!login.isLoggedIn) {
    return (
      <Box>
        <Typography variant="h4">Profiili</Typography>
        <Button variant="outlined" onClick={() => performLogin()}>
          Kirjaudu
        </Button>
      </Box>
    );
  } else {
    return (
      <Box>
        <Typography variant="h4">Hei {login.username}</Typography>
        <Typography variant="body1">Tässä on profiilisi tiedot</Typography>
        <Button variant="contained" color="secondary" onClick={() => performLogout()}>
          Kirjaudu ulos
        </Button>
      </Box>
    );
  }
}
