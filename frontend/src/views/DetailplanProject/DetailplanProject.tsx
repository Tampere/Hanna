import { AccountTree, KeyTwoTone, Mail, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ownsProject } from '@shared/schema/userPermissions';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { PROJECT_AREA_STYLE } from '@frontend/components/Map/styles';
import { authAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { DeleteProjectDialog } from '@frontend/views/Project/DeleteProjectDialog';
import { ProjectRelations } from '@frontend/views/Project/ProjectRelations';

import { TranslationKey } from '@shared/language';

import { ProjectPermissions } from '../Project/ProjectPermissions';
import { DetailplanProjectForm } from './DetailplanProjectForm';
import { DetailplanProjectNotification } from './DetailplanProjectNotification';

type TabView = 'default' | 'sidoshankkeet' | 'tiedotus' | 'luvitus';

interface Tab {
  tabView: TabView;
  url: string;
  label: TranslationKey;
  icon: ReactElement;
}

const pageContentStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

const mapContainerStyle = css`
  height: 100%;
  min-height: 600px;
`;

function getTabs(projectId: string): Tab[] {
  return [
    {
      tabView: 'default',
      url: `/asemakaavahanke/${projectId}`,
      label: 'project.mapTabLabel',
      icon: <Map fontSize="small" />,
    },
    {
      tabView: 'sidoshankkeet',
      url: `/asemakaavahanke/${projectId}/sidoshankkeet`,
      label: 'project.relatedProjectsTabLabel',
      icon: <AccountTree fontSize="small" />,
    },
    {
      tabView: 'tiedotus',
      url: `/asemakaavahanke/${projectId}/tiedotus`,
      label: 'detailplanProject.notification',
      icon: <Mail fontSize="small" />,
    },
    {
      tabView: 'luvitus',
      url: `/asemakaavahanke/${projectId}/luvitus`,
      label: 'project.permissionsTabLabel',
      icon: <KeyTwoTone fontSize="small" />,
    },
  ];
}

export function DetailplanProject() {
  const routeParams = useParams() as { projectId: string; tabView: TabView };
  const tabView = routeParams.tabView ?? 'default';
  const tabs = getTabs(routeParams.projectId);
  const projectId = routeParams?.projectId;
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);
  const user = useAtomValue(authAtom);

  const project = trpc.detailplanProject.get.useQuery(
    { projectId },
    { enabled: Boolean(projectId), queryKey: ['detailplanProject.get', { projectId }] }
  );
  const tr = useTranslations();

  if (projectId && project.isLoading) {
    return <Typography>{tr('loading')}</Typography>;
  }

  if (project.isError && project.error.data?.code !== 'UNAUTHORIZED') {
    return (
      <ErrorPage
        severity="warning"
        message={
          project.error.data?.code === 'NOT_FOUND' ? tr('project.notFound') : tr('unknownError')
        }
      />
    );
  }

  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <Breadcrumbs sx={{ mb: 1 }}>
        {project.data ? (
          <Chip label={project.data?.projectName} />
        ) : (
          <Chip variant="outlined" label={tr('newDetailplanProject.formTitle')} />
        )}
      </Breadcrumbs>

      <div css={pageContentStyle}>
        <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} variant="outlined">
          <DetailplanProjectForm project={project.data} />
          {project.data && (
            <DeleteProjectDialog
              disabled={!ownsProject(user, project.data)}
              projectId={project.data.projectId ?? ''}
              message={tr('detailplanProject.deleteDialogMessage')}
            />
          )}
        </Paper>

        <Paper
          variant="outlined"
          css={css`
            display: flex;
            flex-direction: column;
            height: 100%;
            overflow-y: auto;
          `}
        >
          <Tabs
            value={tabIndex}
            indicatorColor="primary"
            textColor="primary"
            TabIndicatorProps={{ sx: { height: '5px' } }}
          >
            {tabs.map((tab) => (
              <Tab
                disabled={!project.data}
                key={tab.tabView}
                component={Link}
                to={tab.url}
                icon={tab.icon}
                iconPosition="end"
                label={tr(tab.label)}
              />
            ))}
          </Tabs>

          {!routeParams.tabView && (
            <Box css={mapContainerStyle}>
              <MapWrapper
                geoJson={project.data?.geom}
                drawStyle={PROJECT_AREA_STYLE}
                fitExtent="geoJson"
                editable={false}
              />
            </Box>
          )}

          {routeParams.tabView && (
            <Box sx={{ p: 2, overflowY: 'auto' }}>
              {routeParams.tabView === 'sidoshankkeet' && (
                <ProjectRelations projectId={routeParams.projectId} />
              )}
              {routeParams.tabView === 'tiedotus' && (
                <DetailplanProjectNotification projectId={routeParams.projectId} />
              )}
              {routeParams.tabView === 'luvitus' && (
                <ProjectPermissions projectId={routeParams.projectId} />
              )}
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
