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

import { authAtom } from '@frontend/stores/auth';

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

export function Layout() {
  const [auth] = useAtom(authAtom);

  return (
    <>
      <CssBaseline />
      <Box sx={{ height: '100vh' }}>
        <ThemeProvider theme={theme}>
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
                <Button component={Link} to="/projects" sx={{ color: 'white' }}>
                  <AccountTreeOutlined sx={{ mr: 1 }} />
                  Hankkeet
                </Button>
                <Button component={Link} to="/search" sx={{ color: 'white' }}>
                  <SearchIcon sx={{ mr: 1 }} />
                  Haku
                </Button>
              </Box>
              <Box>
                <Typography variant="caption">{auth.userId}</Typography>
                <IconButton
                  component={Link}
                  to="/profile"
                  size="large"
                  aria-label="user"
                  color="inherit"
                >
                  <AccountCircleOutlined />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/settings"
                  size="large"
                  aria-label="settings"
                  color="inherit"
                >
                  <SettingsOutlined />
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>
          <Box sx={{ margin: '16px' }}>
            <Outlet />
          </Box>
        </ThemeProvider>
      </Box>
    </>
  );
}
