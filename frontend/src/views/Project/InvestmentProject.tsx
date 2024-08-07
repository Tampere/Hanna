import { css } from '@emotion/react';
import { AccountTree, Euro, KeyTwoTone, ListAlt, Map, Undo } from '@mui/icons-material';
import { Box, Breadcrumbs, Button, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import VectorSource from 'ol/source/Vector';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { DRAW_LAYER_Z_INDEX, featuresFromGeoJSON } from '@frontend/components/Map/mapInteractions';
import { PROJECT_AREA_STYLE } from '@frontend/components/Map/styles';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { getProjectObjectsLayer } from '@frontend/stores/map';
import { ProjectRelations } from '@frontend/views/Project/ProjectRelations';
import { ProjectObjectList } from '@frontend/views/ProjectObject/ProjectObjectList';

import { User } from '@shared/schema/user';
import {
  ProjectPermissionContext,
  hasPermission,
  hasWritePermission,
  ownsProject,
} from '@shared/schema/userPermissions';

import { DeleteProjectDialog } from './DeleteProjectDialog';
import { InvestmentProjectForm } from './InvestmentProjectForm';
import { ProjectFinances } from './ProjectFinances';
import { ProjectPermissions } from './ProjectPermissions';

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

function getTabs(projectId: string) {
  return [
    {
      tabView: 'default',
      url: `/investointihanke/${projectId}`,
      label: 'project.mapTabLabel',
      icon: <Map fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'talous',
      url: `/investointihanke/${projectId}?tab=talous`,
      label: 'project.financeTabLabel',
      icon: <Euro fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'kohteet',
      url: `/investointihanke/${projectId}?tab=kohteet`,
      label: 'project.projectObjectsTabLabel',
      icon: <ListAlt fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'sidoshankkeet',
      url: `/investointihanke/${projectId}?tab=sidoshankkeet`,
      label: 'project.relatedProjectsTabLabel',
      icon: <AccountTree fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'luvitus',
      url: `/investointihanke/${projectId}?tab=luvitus`,
      label: 'project.permissionsTabLabel',
      icon: <KeyTwoTone fontSize="small" />,
      hasAccess: (user: User, project: ProjectPermissionContext) =>
        ownsProject(user, project) || hasWritePermission(user, project),
    },
  ] as const;
}

export function InvestmentProject() {
  const routeParams = useParams() as { projectId: string };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabView = searchParams.get('tab') || 'default';
  const user = useAtomValue(asyncUserAtom);
  const projectId = routeParams?.projectId;
  const project = trpc.investmentProject.get.useQuery(
    { projectId },
    { enabled: Boolean(projectId), queryKey: ['investmentProject.get', { projectId }] },
  );
  const userCanModify = Boolean(
    project.data &&
      user &&
      (ownsProject(user, project.data) || hasWritePermission(user, project.data)),
  );
  const userCanModifyFinances = Boolean(
    project.data && user && hasPermission(user, 'financials.write'),
  );

  const tabs = getTabs(routeParams.projectId).filter(
    (tab) => project?.data && user && tab.hasAccess(user, project.data),
  );
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

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
    { enabled: Boolean(projectId), queryKey: ['projectObject.getByProjectId', { projectId }] },
  );

  const projectObjectSource = useMemo(() => {
    const source = new VectorSource();
    if (projectObjects?.data) {
      for (const projObj of projectObjects.data) {
        if (projObj.geom) {
          const geoJson = JSON.parse(projObj.geom);
          const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
          for (const feature of features) {
            feature.setId(projObj.projectObjectId);
            source.addFeature(feature);
          }
        }
      }
    }
    return source;
  }, [projectObjects.data]);

  const projectObjectsLayer = useMemo(() => {
    const layer = getProjectObjectsLayer(projectObjectSource);
    layer.setZIndex(DRAW_LAYER_Z_INDEX + 1);
    return layer;
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
      <Box
        css={css`
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        `}
      >
        <Breadcrumbs>
          {project.data ? (
            <Chip label={project.data?.projectName} />
          ) : (
            <Chip variant="outlined" label={tr('newInvestmentProject.formTitle')} />
          )}
        </Breadcrumbs>
        {!projectId && (
          <Button
            css={css`
              margin: 0 0 0 auto;
            `}
            size="small"
            startIcon={<Undo />}
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate(-1)}
          >
            {tr('cancel')}
          </Button>
        )}
      </Box>

      <div css={pageContentStyle}>
        <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} variant="outlined">
          <InvestmentProjectForm edit={!projectId} project={project.data} geom={geom} />
          {project.data && (
            <DeleteProjectDialog
              disabled={Boolean(user && !ownsProject(user, project.data))}
              projectId={project.data.projectId}
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
                drawOptions={{
                  toolsHidden: ['newPointFeature'],
                  geoJson: project?.data?.geom ?? null,
                  drawStyle: PROJECT_AREA_STYLE,
                  editable: !projectId || userCanModify,
                  onFeaturesSaved: (features) => {
                    if (!project.data) {
                      setGeom(features);
                    } else {
                      geometryUpdate.mutate({ projectId, features });
                    }
                  },
                }}
                fitExtent="geoJson"
                vectorLayers={[projectObjectsLayer]}
                projectObjects={
                  projectObjects.data?.map((obj) => ({
                    ...obj,
                    project: {
                      projectId: projectId,
                      projectName: project.data?.projectName ?? '',
                    },
                  })) ?? []
                }
                interactiveLayers={['projectObjects']}
              />
            </Box>
          )}

          {tabView !== 'default' && (
            <Box sx={{ m: 2, overflowY: 'auto' }}>
              {tabView === 'talous' && (
                <ProjectFinances
                  editable={userCanModifyFinances}
                  project={project.data}
                  writableFields={['amount']}
                />
              )}
              {tabView === 'kohteet' && (
                <ProjectObjectList
                  editable={userCanModify}
                  projectId={projectId}
                  projectType="investointihanke"
                />
              )}
              {tabView === 'sidoshankkeet' && (
                <ProjectRelations projectId={routeParams.projectId} editable={userCanModify} />
              )}
              {tabView === 'luvitus' && (
                <ProjectPermissions
                  projectId={routeParams.projectId}
                  ownerId={project.data?.owner}
                />
              )}
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
}
