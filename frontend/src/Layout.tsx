import { css } from '@emotion/react';
import { HelpOutline, Logout, Settings } from '@mui/icons-material';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';

import { SessionExpiredWarning } from './SessionExpiredWarning';
import NotificationList from './services/notification';
import { authAtom, sessionExpiredAtom } from './stores/auth';

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuAnchor = useRef<HTMLButtonElement>(null);

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
        <Box
          css={css`
            display: flex;
            flex-grow: 1;
            justify-content: space-between;
          `}
        >
          <Button component={Link} to="/hankkeet" sx={{ color: 'white' }}>
            <AccountTreeOutlined sx={{ mr: 1 }} />
            {tr('pages.projectsTitle')}
          </Button>

          <Box
            css={css`
              display: flex;
            `}
          >
            <Button
              component={Link}
              to="/ohje"
              target="_blank"
              sx={{ color: 'white', float: 'right' }}
              startIcon={<HelpOutline />}
            >
              {tr('pages.manualTitle')}
            </Button>
            <Button
              component={Link}
              to="/hallinta/urakoitsijat"
              sx={{ color: 'white', float: 'right' }}
              startIcon={<Settings />}
            >
              {tr('pages.managementTitle')}
            </Button>

            <span
              css={css`
                margin-left: 16px;
                margin-right: 24px;
                height: 100%;
                border-left: 2px solid #aaa;
              `}
            />
          </Box>
        </Box>
        <Box>
          <Typography variant="caption">{auth?.name}</Typography>

          <IconButton
            size="large"
            aria-label="user"
            color="inherit"
            onClick={() => setProfileMenuOpen(true)}
            ref={profileMenuAnchor}
          >
            <AccountCircleOutlined />
          </IconButton>
          <Menu
            open={profileMenuOpen}
            onClose={() => setProfileMenuOpen(false)}
            anchorEl={profileMenuAnchor.current}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem
              onClick={() => {
                window.location.pathname = '/logout';
              }}
            >
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText>{tr('profile.logout')}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export function Layout() {
  const sessionExpired = useAtomValue(sessionExpiredAtom);

  const mainLayoutStyle = css`
    height: 100vh;
    display: flex;
    flex-direction: column;
    ${sessionExpired &&
    css`
      pointer-events: none;
      user-select: none;
    `}
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
          <SessionExpiredWarning />
        </ThemeProvider>
      </Box>
    </>
  );
}
