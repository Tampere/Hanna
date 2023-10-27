import { css } from '@emotion/react';
import { Assignment, Euro, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { ReactElement, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { featuresFromGeoJSON } from '@frontend/components/Map/mapInteractions';
import { PROJECT_AREA_STYLE, PROJ_OBJ_STYLE } from '@frontend/components/Map/styles';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';
import { ProjectTypePath } from '@frontend/types';
import Tasks from '@frontend/views/Task/Tasks';

import { TranslationKey } from '@shared/language';

import { DeleteProjectObjectDialog } from './DeleteProjectObjectDialog';
import { ProjectObjectFinances } from './ProjectObjectFinances';
import { ProjectObjectForm } from './ProjectObjectForm';
import { ProjectObjectOperativeForm } from './ProjectObjectOperativeForm';

type TabView = 'default' | 'talous' | 'tehtavat';

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
`;

function projectObjectTabs(
  projectId: string,
  projectType: ProjectTypePath,
  projectObjectId: string
): Tab[] {
  return [
    {
      tabView: 'default',
      url: `/${projectType}/${projectId}/kohde/${projectObjectId}`,
      label: 'projectObject.mapTabLabel',
      icon: <Map fontSize="small" />,
    },
    {
      tabView: 'talous',
      url: `/${projectType}/${projectId}/kohde/${projectObjectId}/talous`,
      label: 'project.financeTabLabel',
      icon: <Euro fontSize="small" />,
    },
    {
      tabView: 'tehtavat',
      url: `/${projectType}/${projectId}/kohde/${projectObjectId}/tehtavat`,
      label: 'task.tasks',
      icon: <Assignment fontSize="small" />,
    },
  ];
}

const mapContainerStyle = css`
  height: 100%;
  min-height: 600px;
`;

interface Props {
  projectType: ProjectTypePath;
}

export function ProjectObject(props: Props) {
  const routeParams = useParams() as {
    projectId: string;
    projectObjectId: string;
    tabView?: TabView;
  };
  const location = useLocation();
  const navigateTo = new URLSearchParams(location.search).get('from');

  const projectObjectId = routeParams?.projectObjectId;
  const tabView = routeParams.tabView ?? 'default';
  const tabs = projectObjectTabs(routeParams.projectId, props.projectType, projectObjectId);
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

  const projectObject = trpc.projectObject.get.useQuery(
    {
      projectId: routeParams.projectId,
      id: projectObjectId,
    },
    { enabled: Boolean(projectObjectId) }
  );

  const [geom, setGeom] = useState<string | null>(null);

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
      style: PROJECT_AREA_STYLE,
      properties: {
        id: 'project',
        type: 'vector',
      },
    });
  }, [project.data]);

  if (projectObjectId && projectObject?.isLoading) {
    return <Typography>{tr('loading')}</Typography>;
  }

  if (projectObject.isError && projectObject.error.data?.code !== 'UNAUTHORIZED') {
    return (
      <ErrorPage
        severity="warning"
        message={
          projectObject.error.data?.code === 'NOT_FOUND'
            ? tr('projectObject.notFound')
            : tr('unknownError')
        }
      />
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        {routeParams.projectId && (
          <Chip
            clickable={true}
            component={Link}
            to={`/${props.projectType}/${routeParams.projectId}/kohteet`}
            label={<u>{project.data?.projectName}</u>}
          />
        )}
        {projectObject.data ? (
          <Chip label={projectObject.data?.objectName} />
        ) : (
          <Chip variant="outlined" label={tr('newProjectObject.title')} />
        )}
      </Breadcrumbs>

      <div css={pageContentStyle}>
        <Box sx={{ height: '100%' }}>
          <Paper sx={{ p: 3, marginBottom: '1em' }} variant="outlined">
            <ProjectObjectForm
              projectId={routeParams.projectId}
              projectType={props.projectType}
              projectObject={projectObject.data}
              geom={geom}
              navigateTo={navigateTo}
            />
          </Paper>
          {/* <Paper sx={{ p: 3 }} variant="outlined">
            <ProjectObjectOperativeForm
              projectId={routeParams.projectId}
              projectType={props.projectType}
              projectObject={projectObject.data}
            />
          </Paper> */}
          {projectObject.data && (
            <DeleteProjectObjectDialog
              projectId={routeParams.projectId}
              projectType={props.projectType}
              projectObjectId={projectObjectId}
            />
          )}
        </Box>

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
                disabled={!projectObject.data}
                key={tab.tabView}
                component={Link}
                to={tab.url}
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
                drawStyle={PROJ_OBJ_STYLE}
                editable={true}
                vectorLayers={[projectLayer]}
                fitExtent="vectorLayers"
                onFeaturesSaved={(features) => {
                  if (!projectObject.data) {
                    setGeom(features);
                  } else {
                    geometryUpdate.mutate({ id: projectObjectId, features });
                  }
                }}
              />
            </Box>
          )}

          {routeParams.tabView && (
            <Box sx={{ m: 2 }}>
              {routeParams.tabView === 'talous' && projectObject.data && (
                <ProjectObjectFinances projectObject={projectObject.data} />
              )}
              {routeParams.tabView === 'tehtavat' && <Tasks projectObjectId={projectObjectId} />}
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
