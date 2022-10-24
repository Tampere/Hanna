import { Box, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';

export function Projects() {
  return (
    <Box>
      <Typography variant="h4">Hankkeet</Typography>
      <Typography variant="body1">Tässä on hankkeiden tiedot</Typography>
      <Link to={'/hanke/luo'}>Luo uusi hanke</Link>
    </Box>
  );
}
