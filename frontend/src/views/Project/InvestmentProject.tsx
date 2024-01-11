import { css } from '@emotion/react';
import { AccountTree, Euro, ListAlt, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { DRAW_LAYER_Z_INDEX, featuresFromGeoJSON } from '@frontend/components/Map/mapInteractions';
import { PROJECT_AREA_STYLE, PROJ_OBJ_STYLE } from '@frontend/components/Map/styles';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { ProjectRelations } from '@frontend/views/Project/ProjectRelations';
import { ProjectObjectList } from '@frontend/views/ProjectObject/ProjectObjectList';

import { DeleteProjectDialog } from './DeleteProjectDialog';
import { InvestmentProjectForm } from './InvestmentProjectForm';
import { ProjectFinances } from './ProjectFinances';

const pageContentStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

const mapContainerStyle = css`
  min-height: 320px;
  flex: 1;
  position: relative;
`;

type TabView = 'default' | 'talous' | 'kohteet' | 'sidoshankkeet';

function projectTabs(projectId: string) {
  return [
    {
      tabView: 'default',
      url: `/investointihanke/${projectId}`,
      label: 'project.mapTabLabel',
      icon: <Map fontSize="small" />,
    },
    {
      tabView: 'talous',
      url: `/investointihanke/${projectId}?tab=talous`,
      label: 'project.financeTabLabel',
      icon: <Euro fontSize="small" />,
    },
    {
      tabView: 'kohteet',
      url: `/investointihanke/${projectId}?tab=kohteet`,
      label: 'project.projectObjectsTabLabel',
      icon: <ListAlt fontSize="small" />,
    },
    {
      tabView: 'sidoshankkeet',
      url: `/investointihanke/${projectId}?tab=sidoshankkeet`,
      label: 'project.relatedProjectsTabLabel',
      icon: <AccountTree fontSize="small" />,
    },
  ] as const;
}

export function InvestmentProject() {
  const routeParams = useParams() as { projectId: string };
  const [searchParams] = useSearchParams();
  const tabView = searchParams.get('tab') || 'default';
  const tabs = projectTabs(routeParams.projectId);
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);
  const projectId = routeParams?.projectId;
  const project = trpc.investmentProject.get.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId), queryKey: ['investmentProject.get', { id: projectId }] }
  );

  const [geom, setGeom] = useState<string | null>(null);

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

  const projectObjects = trpc.projectObject.getByProjectId.useQuery(
    { projectId },
    { enabled: Boolean(projectId), queryKey: ['projectObject.getByProjectId', { projectId }] }
  );

  const projectObjectSource = useMemo(() => {
    const source = new VectorSource();
    if (projectObjects?.data) {
      for (const projObj of projectObjects.data) {
        if (projObj.geom) {
          const geoJson = JSON.parse(projObj.geom);
          const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
          for (const feature of features) {
            source.addFeature(feature);
          }
        }
      }
    }
    return source;
  }, [projectObjects.data]);

  const projectObjectsLayer = useMemo(() => {
    return new VectorLayer({
      zIndex: DRAW_LAYER_Z_INDEX + 1,
      source: projectObjectSource,
      style: PROJ_OBJ_STYLE,
      properties: {
        id: 'projectObjects',
        type: 'vector',
      },
    });
  }, [projectObjects.data]);

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
          <Chip variant="outlined" label={tr('newProject.formTitle')} />
        )}
      </Breadcrumbs>

      <div css={pageContentStyle}>
        <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} variant="outlined">
          <InvestmentProjectForm edit={!projectId} project={project.data} geom={geom} />
          {project.data && (
            <DeleteProjectDialog
              projectId={project.data.id}
              message={tr('project.deleteDialogMessage')}
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

          {tabView === 'default' && (
            <Box css={mapContainerStyle}>
              <MapWrapper
                geoJson={project?.data?.geom}
                drawStyle={PROJECT_AREA_STYLE}
                fitExtent="geoJson"
                editable={true}
                onFeaturesSaved={(features) => {
                  if (!project.data) {
                    setGeom(features);
                  } else {
                    geometryUpdate.mutate({ id: projectId, features });
                  }
                }}
                vectorLayers={[projectObjectsLayer]}
              />
            </Box>
          )}

          {tabView !== 'default' && (
            <Box sx={{ m: 2, overflowY: 'auto' }}>
              {tabView === 'talous' && <ProjectFinances project={project.data} />}
              {tabView === 'kohteet' && (
                <ProjectObjectList projectId={projectId} projectType="investointihanke" />
              )}
              {tabView === 'sidoshankkeet' && (
                <ProjectRelations projectId={routeParams.projectId} />
              )}
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
