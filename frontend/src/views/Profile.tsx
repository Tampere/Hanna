import { Box, Typography } from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';

import { authAtom } from '@frontend/stores/auth';

export function Profile() {
  const [user] = useAtom(authAtom);

  if (user.userId) {
    return (
      <Box>
        <Typography variant="h4">Hei {user.userId}</Typography>
        <Typography variant="body1">Tässä on profiilisi tiedot</Typography>
      </Box>
    );
  }
}
