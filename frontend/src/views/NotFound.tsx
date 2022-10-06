import { Box, Typography } from '@mui/material';
import React from 'react';

export function NotFound() {
  return (
    <Box>
      <Typography variant="h4">Not found</Typography>
      <Typography variant="body1">This page does not exist</Typography>
    </Box>
  );
}
