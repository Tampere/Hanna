import { BusinessCenterTwoTone, PersonTwoTone } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';
import { CompanyPage } from '@frontend/views/Management/Company';
import { CompanyContactPage } from '@frontend/views/Management/CompanyContact';

const tabs = [
  {
    tabView: 'yritykset',
    label: 'management.tabs.companies',
    icon: <BusinessCenterTwoTone />,
    to: '/hallinta/yritykset',
  },
  {
    tabView: 'yritysten-yhteyshenkilot',
    label: 'management.tabs.companyContacts',
    icon: <PersonTwoTone />,
    to: '/hallinta/yritysten-yhteyshenkilot',
  },
] as const;

export function Management() {
  const tr = useTranslations();
  const routeParams = useParams() as {
    tabView: typeof tabs[number]['tabView'];
  };

  const [searchParams] = useSearchParams();
  const viewParams = Object.fromEntries(searchParams);

  return (
    <Box>
      <Tabs
        value={routeParams.tabView}
        indicatorColor="primary"
        textColor="primary"
        TabIndicatorProps={{ sx: { height: '3px' } }}
      >
        {tabs.map((tab) => (
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
    </Box>
  );
}
