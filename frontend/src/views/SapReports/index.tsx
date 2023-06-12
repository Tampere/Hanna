import { HandshakeTwoTone, SpaTwoTone } from '@mui/icons-material';
import { Box, Tab, Tabs, Tooltip, Typography, css } from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAtomValue } from 'jotai';
import { ReactElement } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';

import { TranslationKey } from '@shared/language';

import { BlanketContractReport } from './BlanketContractReport';
import { EnvironmentalCodeReport } from './EnvironmentalCodeReport';

dayjs.extend(relativeTime);

type TabView = 'ymparistokoodit' | 'puitesopimukset';

interface Tab {
  tabView: TabView;
  label: TranslationKey;
  icon: ReactElement;
  to: string;
}

const tabs: Tab[] = [
  {
    tabView: 'ymparistokoodit',
    label: 'sapReports.environmentCodes',
    icon: <SpaTwoTone />,
    to: '/sap-raportit/ymparistokoodit',
  },
  {
    tabView: 'puitesopimukset',
    label: 'sapReports.blanketContracts',
    icon: <HandshakeTwoTone />,
    to: '/sap-raportit/puitesopimukset',
  },
];

export function SapReports() {
  const tr = useTranslations();
  const { tabView } = useParams() as {
    tabView: TabView;
  };
  const { data: lastSyncedAt, isLoading: lastSyncedAtLoading } =
    trpc.sap.getLastSyncedAt.useQuery();
  const lang = useAtomValue(langAtom);

  return (
    <Box
      css={css`
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <Tabs
        value={tabView}
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
        {!lastSyncedAtLoading && lastSyncedAt && (
          <Typography
            variant="subtitle2"
            css={css`
              flex-grow: 1;
              text-align: right;
              align-self: center;
            `}
          >
            {tr('sapReports.updatedAt')}{' '}
            <Tooltip title={dayjs(lastSyncedAt).format(tr('datetime.format'))}>
              <span tabIndex={0} style={{ borderBottom: '2px dashed #aaa' }}>
                {dayjs().locale(lang).to(dayjs(lastSyncedAt))}
              </span>
            </Tooltip>
          </Typography>
        )}
      </Tabs>
      {tabView === 'ymparistokoodit' && <EnvironmentalCodeReport />}
      {tabView === 'puitesopimukset' && <BlanketContractReport />}
    </Box>
  );
}
