import { css } from '@emotion/react';
import { BackupTable, Feed, HelpOutline, Logout, Reorder, Settings } from '@mui/icons-material';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';
import { fiFI } from '@mui/material/locale';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';

import { SessionExpiredWarning } from './SessionExpiredWarning';
import { NavigationBlocker } from './components/NavigationBlocker';
import NotificationList from './services/notification';
import { asyncUserAtom, sessionExpiredAtom } from './stores/auth';
import { blockerStatusAtom } from './stores/navigationBlocker';

const theme = createTheme(
  {
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
  },
  fiFI,
);

function Navbar() {
  const auth = useAtomValue(asyncUserAtom);
  const tr = useTranslations();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuAnchor = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  const logoStyle = css`
    font-family: Consolas, Menlo, sans-serif, monospace;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 0.3rem;
  `;

  function getValueFromPathname() {
    if (pathname === '/') {
      return 'hankkeet';
    }
    const currentPath = pathname.split('/')[1];
    return tabs.includes(currentPath) ? currentPath : false;
  }

  const tabs = ['hankkeet', 'sap-raportit', 'investointiohjelma', 'hallinta'];

  return (
    <AppBar position="static" style={{ zIndex: 200 }}>
      <Toolbar
        css={css`
          @media (min-width: 600px) {
          }
          height: 54px;
        `}
      >
        <Box sx={{ mr: 2 }}>
          <Typography variant="h6" noWrap component="div" css={logoStyle}>
            Hanna
          </Typography>
        </Box>
        <Box
          css={css`
            display: flex;
            flex-grow: 1;
            justify-content: space-between;
          `}
        >
          <Tabs
            css={css`
              flex: 1;
              display: flex;
              gap: 10px;

              .MuiTab-root.MuiTab-root {
                color: white;
              }
              .MuiTabs-indicator {
                background-color: white;
              }
            `}
            value={getValueFromPathname()}
          >
            <Tab
              icon={<AccountTreeOutlined sx={{ mr: 1 }} />}
              iconPosition="start"
              label={tr('pages.projectsTitle')}
              component={Link}
              value="hankkeet"
              to="/hankkeet"
            />
            {import.meta.env.VITE_FEATURE_SAP_REPORTS === 'true' && (
              <Tab
                icon={<BackupTable sx={{ mr: 1 }} />}
                iconPosition="start"
                label={tr('pages.sapReportsTitle')}
                component={Link}
                value="sap-raportit"
                to="/sap-raportit/ymparistokoodit"
              />
            )}
            <Tab
              icon={<Reorder sx={{ mr: 1 }} />}
              iconPosition="start"
              label={tr('pages.workTableTitle')}
              component={Link}
              value="investointiohjelma"
              to="/investointiohjelma"
            />
            <Tooltip title={tr('pages.eFormLabel')} style={{ marginLeft: 'auto' }}>
              <Tab
                component={Link}
                to="/redirect-to-elomake"
                target="_blank"
                icon={<Feed />}
                iconPosition="start"
                label={tr('pages.eForm')}
              />
            </Tooltip>
            <Tab
              component={Link}
              to="/ohje"
              target="_blank"
              icon={<HelpOutline />}
              iconPosition="start"
              label={tr('pages.manualTitle')}
            />
            <Tab
              component={Link}
              value="hallinta"
              to="/hallinta/yritykset"
              icon={<Settings />}
              iconPosition="start"
              label={tr('pages.managementTitle')}
            />
          </Tabs>

          <Box
            css={css`
              display: flex;
            `}
          >
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
              data-testid="logoutButton"
              onClick={() => {
                // Server route - cannot use react-router-dom's Link here
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

function VersionIndicator() {
  return (
    <Typography
      css={css`
        position: fixed;
        right: 0;
        bottom: 0;
        padding: 4px 8px;
        border-radius: 10px 0 0 0;
        background: #fff;
        opacity: 0.7;
      `}
    >
      Hanna {APP_VERSION}
    </Typography>
  );
}

export function Layout() {
  const sessionExpired = useAtomValue(sessionExpiredAtom);
  const blockerStatus = useAtomValue(blockerStatusAtom);

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
          <Box css={mainContentStyle} id="mainContentContainer">
            <Outlet />
            <NavigationBlocker status={blockerStatus} />
          </Box>
          <VersionIndicator />
          <SessionExpiredWarning />
        </ThemeProvider>
      </Box>
    </>
  );
}
