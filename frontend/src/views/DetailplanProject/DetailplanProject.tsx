import { AccountTree, Mail, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography, css } from '@mui/material';
import { ReactElement } from 'react';
import { Link, useParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { PROJECT_AREA_STYLE } from '@frontend/components/Map/styles';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { DeleteProjectDialog } from '@frontend/views/Project/DeleteProjectDialog';
import { ProjectRelations } from '@frontend/views/Project/ProjectRelations';

import { TranslationKey } from '@shared/language';

import { DetailplanProjectForm } from './DetailplanProjectForm';
import { DetailplanProjectNotification } from './DetailplanProjectNotification';

type TabView = 'default' | 'sidoshankkeet' | 'tiedotus';

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
  ];
}

export function DetailplanProject() {
  const routeParams = useParams() as { projectId: string; tabView: TabView };
  const tabView = routeParams.tabView ?? 'default';
  const tabs = getTabs(routeParams.projectId);
  const projectId = routeParams?.projectId;
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

  const project = trpc.detailplanProject.get.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId), queryKey: ['detailplanProject.get', { id: projectId }] }
  );
  const tr = useTranslations();
  const notify = useNotifications();

  const geometryUpdate = trpc.project.updateGeometry.useMutation({
    onSuccess: () => {
      project.refetch();
      notify({
        severity: 'success',
        title: tr('project.notifyGeometryUpdateTitle'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('project.notifyGeometryUpdateFailedTitle'),
      });
    },
  });

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
              projectId={project.data.id ?? ''}
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
                editable={Boolean(projectId)}
                onFeaturesSaved={(features) => {
                  geometryUpdate.mutate({ id: projectId, features: features });
                }}
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
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
