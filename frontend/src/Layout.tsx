import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import { useAtom } from 'jotai';
import React from 'react';
import { Link, Outlet } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';

import { authAtom } from './stores/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#22437b',
    },
    secondary: {
      main: '#c83e36',
    },
  },
});

function Navbar() {
  const [auth] = useAtom(authAtom);
  const tr = useTranslations();
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ mr: 2 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '0.3rem',
            }}
          >
            Hanna|TRE
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Button component={Link} to="/hanke" sx={{ color: 'white' }}>
            <AccountTreeOutlined sx={{ mr: 1 }} />
            {tr['menubar.projects']}
          </Button>
          <Button component={Link} to="/haku" sx={{ color: 'white' }}>
            <SearchIcon sx={{ mr: 1 }} />
            {tr['menubar.search']}
          </Button>
        </Box>
        <Box>
          <Typography variant="caption">{auth.userId}</Typography>
          <IconButton
            component={Link}
            to="/profiili"
            size="large"
            aria-label="user"
            color="inherit"
          >
            <AccountCircleOutlined />
          </IconButton>
          <IconButton
            component={Link}
            to="/asetukset"
            size="large"
            aria-label="settings"
            color="inherit"
          >
            <SettingsOutlined />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export function Layout() {
  return (
    <>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ThemeProvider theme={theme}>
          <Navbar />
          <Box sx={{ padding: '16px', overflowY: 'auto', flexGrow: 1 }}>
            <Outlet />
          </Box>
        </ThemeProvider>
      </Box>
    </>
  );
}
