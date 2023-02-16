import { BusinessCenterTwoTone, PersonTwoTone } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useTranslations } from '@frontend/stores/lang';
import { CompanyPage } from '@frontend/views/Management/Company';
import { ContractorPage } from '@frontend/views/Management/Contractor';

const tabs = [
  {
    tabView: 'urakoitsijat',
    label: 'management.tabs.contractors',
    icon: <PersonTwoTone />,
    to: '/hallinta/urakoitsijat',
  },
  {
    tabView: 'yritykset',
    label: 'management.tabs.companies',
    icon: <BusinessCenterTwoTone />,
    to: '/hallinta/yritykset',
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
      {routeParams.tabView === 'urakoitsijat' && <ContractorPage {...viewParams} />}
      {routeParams.tabView === 'yritykset' && <CompanyPage {...viewParams} />}
    </Box>
  );
}
