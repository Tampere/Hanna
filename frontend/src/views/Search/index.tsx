import { AddCircleOutline } from '@mui/icons-material';
import { Box, Button, Tab, Tabs, css } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { theme } from '@frontend/Layout';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { selectedSearchViewAtom } from '@frontend/stores/search/searchView';
import { useMapInfoBox } from '@frontend/stores/useMapInfoBox';
import { ProjectsPage, Toolbar } from '@frontend/views/Project/Projects';
import { ProjectObjectsPage } from '@frontend/views/ProjectObject/ProjectObjects';

import { TranslationKey } from '@shared/language';
import { isAdmin } from '@shared/schema/userPermissions';

type TabView = 'hankkeet' | 'kohteet';

interface Tab {
  tabView: TabView;
  label: TranslationKey;
  to: string;
  color: string;
}

const tabs: Tab[] = [
  {
    tabView: 'hankkeet',
    label: 'pages.projectsTitle',
    color: 'green',
    to: '/kartta/hankkeet',
  },
  {
    tabView: 'kohteet',
    label: 'pages.projectObjectsTitle',
    color: theme.palette.primary.main,
    to: '/kartta/kohteet',
  },
];

export function SearchPage() {
  const tr = useTranslations();
  const { tabView } = useParams() as {
    tabView: TabView;
  };
  const setSelectedSearchView = useSetAtom(selectedSearchViewAtom);
  const auth = useAtomValue(asyncUserAtom);
  const { resetInfoBox } = useMapInfoBox();

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
      `}
    >
      <Box
        css={css`
          display: flex;
          & .toolbar-container {
            margin-left: auto;
          }
        `}
      >
        <Tabs value={tabView} TabIndicatorProps={{ sx: { height: '3px' } }}>
          {tabs.map((tab) => (
            <Tab
              onClick={() => {
                resetInfoBox();
                setSelectedSearchView(tab.tabView);
              }}
              css={css`
                &.MuiTab-root.Mui-selected {
                  color: ${tab.color};
                }
              `}
              value={tab.tabView}
              key={tab.to}
              component={Link}
              to={tab.to}
              label={tr(tab.label)}
              iconPosition="end"
            />
          ))}
        </Tabs>
        {tabView === 'hankkeet' && <Toolbar />}
        {tabView === 'kohteet' && (
          <Button
            size="medium"
            css={css`
              max-height: 36.5px;
              align-self: center;
              margin-left: auto;
            `}
            variant="contained"
            component={Link}
            to="/kohde/uusi?from=/kartta/kohteet"
            endIcon={<AddCircleOutline />}
            disabled={!isAdmin(auth.role)}
          >
            {tr('newProjectObject.title')}
          </Button>
        )}
      </Box>

      {tabView === 'hankkeet' && <ProjectsPage />}
      {tabView === 'kohteet' && <ProjectObjectsPage />}
    </Box>
  );
}
