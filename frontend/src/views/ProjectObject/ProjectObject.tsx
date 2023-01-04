import { css } from '@emotion/react';
import { Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { featuresFromGeoJSON } from '@frontend/components/Map/mapInteractions';
import { projectBoundsStyle } from '@frontend/components/Map/styles';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { ProjectObjectForm } from './ProjectObjectForm';

const pageContentStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
  height: 100%;
`;

function projectObjectTabs() {
  return [
    {
      tabView: 'default',
      url: `/kohteet/:projectId/:projectObjectId`,
      label: 'projectObject.mapTabLabel',
      icon: <Map fontSize="small" />,
    },
  ] as const;
}

const mapContainerStyle = css`
  height: 100%;
  min-height: 600px;
`;

export function ProjectObject() {
  const routeParams = useParams() as {
    projectId: string;
    projectObjectId: string;
    tabView?: 'talous';
  };
  const projectObjectId = routeParams?.projectObjectId;
  const tabs = projectObjectTabs();
  const tabIndex = tabs.findIndex((tab) => tab.tabView === 'default');

  const projectObject = trpc.projectObject.get.useQuery(
    {
      projectId: routeParams.projectId,
      id: projectObjectId,
    },
    { enabled: Boolean(projectObjectId) }
  );

  const tr = useTranslations();
  const notify = useNotifications();
  const geometryUpdate = trpc.projectObject.updateGeometry.useMutation({
    onSuccess: () => {
      projectObject.refetch();
      notify({
        severity: 'success',
        title: tr('projectObject.notifyGeometryUpdateTitle'),
        duration: 5000,
      });
    },
    onError: () => {
      notify({
        severity: 'error',
        title: tr('projectObject.notifyGeometryUpdateFailedTitle'),
      });
    },
  });

  const project = trpc.project.get.useQuery(
    { id: routeParams.projectId },
    { enabled: Boolean(routeParams.projectId) }
  );

  // Create vectorlayer of the project geometry
  const projectSource = useMemo(() => {
    const source = new VectorSource();
    if (project?.data?.geom) {
      const geoJson = JSON.parse(project.data.geom);
      const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
      source.addFeatures(features);
    }
    return source;
  }, [project.data]);

  const projectLayer = useMemo(() => {
    return new VectorLayer({
      source: projectSource,
      style: projectBoundsStyle,
    });
  }, [project.data]);

  if (projectObjectId && projectObject?.isLoading) {
    return <Typography>{tr('loading')}</Typography>;
  }

  if (projectObject?.isError) {
    return <ErrorPage severity="warning" message={tr('projectObject.notFound')} />;
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Chip
          clickable={true}
          component={Link}
          to={`/hanke/${routeParams.projectId}/kohteet`}
          label={<u>{project.data?.projectName}</u>}
        />
        {projectObject.data ? (
          <Chip label={projectObject.data?.objectName} />
        ) : (
          <Chip variant="outlined" label={tr('newProjectObject.title')} />
        )}
      </Breadcrumbs>

      <div css={pageContentStyle}>
        <Paper sx={{ p: 3, height: '100%' }} variant="outlined">
          <ProjectObjectForm projectId={routeParams.projectId} projectObject={projectObject.data} />
        </Paper>

        <Paper
          variant="outlined"
          css={css`
            display: flex;
            flex-direction: column;
            height: 100%;
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
                key={tab.tabView}
                component={Link}
                to={`/hanke/${routeParams.projectId}/kohde/${projectObjectId}`}
                label={tr(tab.label)}
                icon={tab.icon}
                iconPosition="end"
              />
            ))}
          </Tabs>

          {!routeParams.tabView && (
            <Box css={mapContainerStyle}>
              <MapWrapper
                geoJson={projectObject?.data?.geom}
                editable={Boolean(projectObjectId)}
                vectorLayers={[projectLayer]}
                fitExtent="vectorLayers"
                onFeaturesSaved={(features) => {
                  geometryUpdate.mutate({ id: projectObjectId, features: features });
                }}
              />
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
