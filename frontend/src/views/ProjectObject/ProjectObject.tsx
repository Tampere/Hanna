import { css } from '@emotion/react';
import { Assignment, Euro, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import VectorSource from 'ol/source/Vector';
import { ReactElement, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { getProjectObjectGeoJSON } from '@frontend/components/Map/mapFunctions';
import { featuresFromGeoJSON } from '@frontend/components/Map/mapInteractions';
import { PROJ_OBJ_DRAW_STYLE } from '@frontend/components/Map/styles';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { getProjectObjectsLayer, getProjectsLayer } from '@frontend/stores/map';
import { ProjectTypePath } from '@frontend/types';
import Tasks from '@frontend/views/Task/Tasks';

import { TranslationKey } from '@shared/language';
import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';

import { DeleteProjectObjectDialog } from './DeleteProjectObjectDialog';
import { ProjectObjectFinances } from './ProjectObjectFinances';
import { ProjectObjectForm } from './ProjectObjectForm';

type TabView = 'default' | 'talous' | 'vaiheet';

interface Tab {
  tabView: TabView;
  url: string;
  label: TranslationKey;
  icon: ReactElement;
}

const pageContentStyle = css`
  display: grid;
  grid-template-columns: minmax(540px, 1fr) minmax(512px, 2fr);
  gap: 16px;
  height: 100%;
  flex: 1;
  overflow: hidden;
`;

function projectObjectTabs(
  projectId: string,
  projectType: ProjectTypePath,
  projectObjectId: string,
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
      url: `/${projectType}/${projectId}/kohde/${projectObjectId}?tab=talous`,
      label: 'project.financeTabLabel',
      icon: <Euro fontSize="small" />,
    },
    {
      tabView: 'vaiheet',
      url: `/${projectType}/${projectId}/kohde/${projectObjectId}?tab=vaiheet`,
      label: 'task.tasks',
      icon: <Assignment fontSize="small" />,
    },
  ];
}

const mapContainerStyle = css`
  min-height: 320px;
  flex: 1;
  position: relative;
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
  const [searchParams] = useSearchParams();
  const tabView = searchParams.get('tab') || 'default';
  const tabs = projectObjectTabs(routeParams.projectId, props.projectType, projectObjectId);
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

  const projectObject = trpc.projectObject.get.useQuery(
    {
      projectId: routeParams.projectId,
      projectObjectId,
    },
    { enabled: Boolean(projectObjectId) },
  );
  const user = useAtomValue(asyncUserAtom);

  const [geom, setGeom] = useState<string | null>(null);
  const [projectId, setProjectId] = useState(routeParams.projectId);

  const tr = useTranslations();
  const notify = useNotifications();
  const geometryUpdate = trpc.projectObject.updateGeometry.useMutation({
    onSuccess: () => {
      projectObject.refetch();
      projectObjectGeometries.refetch();
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

  const project = trpc.project.get.useQuery({ projectId }, { enabled: Boolean(projectId) });
  const projectObjectGeometries = trpc.projectObject.getGeometriesByProjectId.useQuery(
    { projectId },
    { enabled: Boolean(projectId) },
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

  const projectObjectSource = useMemo(() => {
    const source = new VectorSource();
    if (projectObjectGeometries?.data) {
      const geometriesWithouActiveObject = projectObjectGeometries.data.filter(
        (obj) => obj.projectObjectId !== projectObjectId,
      );
      const geoJson = getProjectObjectGeoJSON(geometriesWithouActiveObject);

      const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
      source.addFeatures(features);
    }

    return source;
  }, [projectObjectGeometries.data]);

  const projectObjectLayer = useMemo(() => {
    return getProjectObjectsLayer(projectObjectSource);
  }, [projectObjectGeometries.data]);

  const projectLayer = useMemo(() => {
    return getProjectsLayer(projectSource);
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

  if (!user || (Boolean(projectObjectId) && (projectObject.isLoading || projectObject.isError)))
    return null;

  const isOwner = ownsProject(user, projectObject.data?.acl);
  const canWrite = hasWritePermission(user, projectObject.data?.acl);

  return (
    <Box
      css={css`
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      <Breadcrumbs sx={{ mb: 1 }}>
        {routeParams.projectId && (
          <Chip
            clickable={true}
            component={Link}
            to={`/${props.projectType}/${routeParams.projectId}?tab=kohteet`}
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
        <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} variant="outlined">
          <ProjectObjectForm
            userIsOwner={isOwner}
            userCanWrite={canWrite}
            projectId={routeParams.projectId}
            projectType={props.projectType}
            projectObject={projectObject.data}
            geom={geom}
            setProjectId={setProjectId}
            navigateTo={navigateTo}
          />
          {projectObject.data && (
            <DeleteProjectObjectDialog
              projectId={routeParams.projectId}
              projectType={props.projectType}
              projectObjectId={projectObjectId}
              userCanModify={isOwner || canWrite}
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

          {!searchParams.get('tab') && (
            <Box css={mapContainerStyle}>
              <MapWrapper
                drawOptions={{
                  geoJson: projectObject?.data?.geom ?? null,
                  drawStyle: PROJ_OBJ_DRAW_STYLE,
                  editable: !projectObjectId || isOwner || canWrite,
                  onFeaturesSaved: (features) => {
                    if (!projectObject.data) {
                      setGeom(features);
                      projectObjectGeometries.refetch();
                    } else {
                      geometryUpdate.mutate({ projectObjectId, features });
                    }
                  },
                }}
                vectorLayers={[projectLayer, projectObjectLayer]}
                fitExtent="all"
              />
            </Box>
          )}

          {searchParams.get('tab') && (
            <Box sx={{ m: 2, overflowY: 'auto' }}>
              {searchParams.get('tab') === 'talous' && projectObject.data && (
                <ProjectObjectFinances
                  userIsAdmin={isAdmin(user.role)}
                  userIsEditor={isOwner || canWrite}
                  userCanEditFinances={hasPermission(user, 'financials.write')}
                  projectObject={projectObject.data}
                />
              )}
              {searchParams.get('tab') === 'vaiheet' && (
                <Tasks
                  isOwner={isOwner}
                  canWrite={canWrite}
                  projectObjectId={projectObjectId}
                  canEditFinances={hasPermission(user, 'financials.write')}
                />
              )}
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
