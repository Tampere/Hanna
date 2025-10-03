import { Reorder } from '@mui/icons-material';
import { Box, Tab, Tabs, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';

//import EstimatePlanningTable from './worktables/EstimatePlanningTable';
import PlanningTable from './worktables/PlanningTable';
import WorkTable from './worktables/WorkTable';

const tabs = [
  {
    tabView: 'investointiohjelmointi',
    label: 'pages.planning.workTableTitle',
    icon: <Reorder sx={{ mr: 1 }} />,
    to: '/ohjelmointi/investointiohjelmointi',
    requiredRole: null,
  },
  {
    tabView: 'taloussuunnittelu',
    label: 'pages.estimateplanning.workTableTitle',
    icon: <Reorder sx={{ mr: 1 }} />,
    to: '/ohjelmointi/taloussuunnittelu',
    requiredRole: null,
  },
] as const;

export function InvestmentPlanning() {
  const tr = useTranslations();
  const routeParams = useParams() as {
    tabView: (typeof tabs)[number]['tabView'];
  };

  const auth = useAtomValue(asyncUserAtom);

  const [searchParams] = useSearchParams();
  const viewParams = Object.fromEntries(searchParams);

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;

        height: 100%;
      `}
    >
      <Tabs
        value={routeParams.tabView}
        indicatorColor="primary"
        textColor="primary"
        TabIndicatorProps={{ sx: { height: '3px' } }}
      >
        {tabs
          .filter((tab) => {
            return !tab.requiredRole || auth?.role === tab.requiredRole;
          })
          .map((tab) => (
            <Tab
              value={tab.tabView}
              key={tab.to}
              component={Link}
              to={tab.to}
              label={tr(tab.label)}
              icon={tab.icon}
              iconPosition="end"
            />
          ))}
      </Tabs>
      {routeParams.tabView === 'investointiohjelmointi' && <WorkTable {...viewParams} />}
      {routeParams.tabView === 'taloussuunnittelu' && <PlanningTable {...viewParams} />}
    </Box>
  );
}
