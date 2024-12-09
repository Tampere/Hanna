import { css } from '@emotion/react';
import {
  BackupTable,
  Campaign,
  Feed,
  HelpOutline,
  InfoOutlined,
  Logout,
  Reorder,
  Settings,
} from '@mui/icons-material';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import { fiFI } from '@mui/material/locale';
import { useAtomValue } from 'jotai';
import { useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';

import { SessionExpiredWarning } from './SessionExpiredWarning';
import { trpc } from './client';
import { NavigationBlocker } from './components/NavigationBlocker';
import { TooltipLinkTab } from './components/TooltipLinkTab';
import NotificationList from './services/notification';
import { asyncUserAtom, sessionExpiredAtom } from './stores/auth';
import { selectedSearchViewAtom } from './stores/search/searchView';

export const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#22437b',
        light: '#2196F3',
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

const logoStyle = css`
  color: #fff;
  text-decoration: none;
  :hover {
    color: #bebebe;
  }
  font-size: 20px;

  font-family: Consolas, Menlo, sans-serif, monospace;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.3rem;
`;

function Navbar() {
  const auth = useAtomValue(asyncUserAtom);
  const selectedSearchView = useAtomValue(selectedSearchViewAtom);
  const tr = useTranslations();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const profileMenuAnchor = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();

  const recentGeneralNotifications =
    trpc.generalNotification.getRecentGeneralNotificationCount.useQuery(undefined, {
      staleTime: 15 * 60 * 1000,
    });

  function getValueFromPathname() {
    if (pathname === '/') {
      return 'kartta';
    }
    const currentPath = pathname.split('/')[1];
    return tabs.includes(currentPath) ? currentPath : false;
  }

  const tabs = ['kartta', 'sap-raportit', 'investointiohjelma', 'hallinta', 'tiedotteet'];

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
          <Link to={'/'} css={logoStyle}>
            Hanna
          </Link>
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
              label={tr('pages.homeTitle')}
              component={Link}
              value="kartta"
              to={`/kartta/${selectedSearchView}`}
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
            {recentGeneralNotifications?.data && recentGeneralNotifications.data.count > 0 ? (
              <TooltipLinkTab
                title={tr('pages.generalNewGeneralNotificationsTooltip')}
                cssProp={css`
                  margin-left: auto;
                `}
                to="/tiedotteet"
                icon={<Campaign />}
                iconPosition="start"
                value="tiedotteet"
                label={
                  <>
                    {tr('pages.generalNotificationTitle')}&nbsp;
                    <span
                      css={css`
                        color: #e46c29;
                      `}
                    >
                      [{tr('pages.generalNotificationTitleNew').toUpperCase()}]
                    </span>
                  </>
                }
              />
            ) : (
              <Tab
                style={{ marginLeft: 'auto' }}
                component={Link}
                to="/tiedotteet"
                icon={<Campaign />}
                iconPosition="start"
                value="tiedotteet"
                label={tr('pages.generalNotificationTitle')}
              />
            )}
            <TooltipLinkTab
              title={tr('pages.eFormLabel')}
              to="/redirect-to-elomake"
              target="_blank"
              icon={<Feed />}
              iconPosition="start"
              label={tr('pages.eForm')}
            />
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
            data-test-id="profileMenuButton"
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
            <MenuItem onClick={() => setAboutDialogOpen(true)}>
              <ListItemIcon>
                <InfoOutlined />
              </ListItemIcon>
              <ListItemText>{tr('about.title')}</ListItemText>
            </MenuItem>
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
            <AboutDialog
              open={aboutDialogOpen}
              handleClose={() => {
                setAboutDialogOpen(false);
              }}
            />
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function AboutDialog({ open, handleClose }: { open: boolean; handleClose: () => void }) {
  const tr = useTranslations();

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle css={logoStyle}>Hanna</DialogTitle>
      <DialogContent
        css={css`
          padding: 0 auto;
        `}
      >
        <dl
          css={css`
            min-width: 220px;
            display: grid;
            column-gap: 0.5rem;
            grid-template-columns: 1fr 2fr;
            padding: 0 1rem;

            & dt {
              grid-column: 1;
              font-weight: bold;
              color: #777777;
            }
            & dd {
              grid-column: 2;
              justify-self: start;
              margin-left: 0;
            }
          `}
        >
          <dt>{tr('version')}:</dt>
          <dd>{APP_VERSION}</dd>
        </dl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          {tr('close')}
        </Button>
      </DialogActions>
    </Dialog>
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
          <Box css={mainContentStyle} id="mainContentContainer">
            <Outlet />
            <NavigationBlocker />
          </Box>
          <SessionExpiredWarning />
        </ThemeProvider>
      </Box>
    </>
  );
}
