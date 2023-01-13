import { css } from '@emotion/react';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
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
import { Link, Outlet } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';

import NotificationList from './services/notification';
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
  components: {
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          height: '48px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          height: '48px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          zIndex: 250,
        },
        popper: {
          zIndex: 251,
        },
      },
    },
  },
});

function Navbar() {
  const [auth] = useAtom(authAtom);
  const tr = useTranslations();

  const logoStyle = css`
    font-family: monospace;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 0.3rem;
  `;

  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ mr: 2 }}>
          <Typography variant="h6" noWrap component="div" css={logoStyle}>
            Hanna|TRE
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Button component={Link} to="/hankkeet" sx={{ color: 'white' }}>
            <AccountTreeOutlined sx={{ mr: 1 }} />
            {tr('pages.projectsTitle')}
          </Button>
        </Box>
        <Box>
          <Typography variant="caption">{auth?.name}</Typography>

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
  const mainLayoutStyle = css`
    height: 100vh;
    display: flex;
    flex-direction: column;
  `;

  const mainContentStyle = css`
    padding: 16px;
    overflow-y: auto;
    height: 100%;
  `;

  return (
    <>
      <CssBaseline />
      <Box css={mainLayoutStyle}>
        <ThemeProvider theme={theme}>
          <Navbar />
          <NotificationList />
          <Box css={mainContentStyle}>
            <Outlet />
          </Box>
        </ThemeProvider>
      </Box>
    </>
  );
}
