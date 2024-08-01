import { BusinessCenterTwoTone, Campaign, KeyTwoTone, PersonTwoTone } from '@mui/icons-material';
import { Box, Tab, Tabs, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { CompanyPage } from '@frontend/views/Management/Company';
import { CompanyContactPage } from '@frontend/views/Management/CompanyContact';
import { UserPermissionsPage } from '@frontend/views/Management/UserPermissions';

import { ManageGeneralNotifications } from './GeneralNotifications';

const tabs = [
  {
    tabView: 'yritykset',
    label: 'management.tabs.companies',
    icon: <BusinessCenterTwoTone />,
    to: '/hallinta/yritykset',
    requiredRole: null,
  },
  {
    tabView: 'yritysten-yhteyshenkilot',
    label: 'management.tabs.companyContacts',
    icon: <PersonTwoTone />,
    to: '/hallinta/yritysten-yhteyshenkilot',
    requiredRole: null,
  },
  {
    tabView: 'kayttajien-luvitus',
    label: 'management.tabs.userPermissions',
    icon: <KeyTwoTone />,
    to: '/hallinta/kayttajien-luvitus',
    requiredRole: 'Hanna.Admin',
  },
  {
    tabView: 'tiedotteet',
    label: 'management.tabs.generalNotifications',
    icon: <Campaign />,
    to: '/hallinta/tiedotteet',
    requiredRole: 'Hanna.Admin',
  },
] as const;

export function Management() {
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
      {routeParams.tabView === 'yritysten-yhteyshenkilot' && <CompanyContactPage {...viewParams} />}
      {routeParams.tabView === 'yritykset' && <CompanyPage {...viewParams} />}
      {routeParams.tabView === 'kayttajien-luvitus' && <UserPermissionsPage {...viewParams} />}
      {routeParams.tabView === 'tiedotteet' && <ManageGeneralNotifications />}
    </Box>
  );
}
