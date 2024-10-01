import { css } from '@emotion/react';
import { Assignment, Euro, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import VectorSource from 'ol/source/Vector';
import { ReactElement, useMemo, useState } from 'react';
import { useParams } from 'react-router';
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
import { projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';
import Tasks from '@frontend/views/Task/Tasks';

import { TranslationKey } from '@shared/language';
import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';

import { ProjectViewWrapper } from '../Project/ProjectViewWrapper';
import { InvestmentProjectObjectForm } from './InvestmentProjectObjectForm';
import { MaintenanceProjectObjectForm } from './MaintenanceProjectObjectForm';
import { ProjectObjectFinances } from './ProjectObjectFinances';

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
  projectType: Exclude<ProjectTypePath, 'asemakaavahanke'>;
}

export function ProjectObject(props: Props) {
  const routeParams = useParams() as {
    projectId: string;
    projectObjectId: string;
    tabView?: TabView;
  };

  const projectObjectId = routeParams?.projectObjectId;
  const [searchParams] = useSearchParams();

  const tabView = searchParams.get('tab') || 'default';
  const tabs = projectObjectTabs(routeParams.projectId, props.projectType, projectObjectId);
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

  const projectObject =
    props.projectType === 'investointihanke'
      ? trpc.investmentProjectObject.get.useQuery(
          {
            projectId: routeParams.projectId,
            projectObjectId,
          },
          { enabled: Boolean(projectObjectId) },
        )
      : trpc.maintenanceProjectObject.get.useQuery(
          {
            projectId: routeParams.projectId,
            projectObjectId,
          },
          { enabled: Boolean(projectObjectId) },
        );
  const projectObjects = trpc.projectObject.getByProjectId.useQuery({
    projectId: routeParams.projectId,
  });

  const user = useAtomValue(asyncUserAtom);
  const editing = useAtomValue(projectEditingAtom);

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
      features.forEach((feature) => {
        feature.setId(project.data.projectId);
      });
      source.addFeatures(features);
    }
    return source;
  }, [project.data]);

  const projectObjectSource = useMemo(() => {
    const source = new VectorSource();
    if (projectObjectGeometries?.data) {
      const geometriesWithoutActiveObject = projectObjectGeometries.data.filter(
        (obj) => obj.projectObjectId !== projectObjectId,
      );
      const geoJson = getProjectObjectGeoJSON(geometriesWithoutActiveObject);

      const features = geoJson ? featuresFromGeoJSON(geoJson) : [];
      source.addFeatures(features);
    }

    return source;
  }, [projectObjectGeometries.data, projectObjectId]);

  const projectObjectLayer = useMemo(() => {
    return getProjectObjectsLayer(projectObjectSource, 0.4);
  }, [projectObjectGeometries.data, projectObjectId]);

  const projectLayer = useMemo(() => {
    return getProjectsLayer(projectSource);
  }, [project.data]);

  function handleFormCancel(formRef: React.RefObject<{ onCancel: () => void }>) {
    if (formRef.current?.onCancel) {
      formRef.current?.onCancel();
    }
  }

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
    <ProjectViewWrapper
      projectType={props.projectType}
      type="projectObject"
      permissionCtx={projectObject.data ? projectObject.data.acl : null}
      handleFormCancel={(formRef) => handleFormCancel(formRef)}
      renderHeaderContent={() => (
        <Box
          css={css`
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
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
        </Box>
      )}
      renderMainContent={(tabRefs) => (
        <div css={pageContentStyle}>
          <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }} variant="outlined">
            {props.projectType === 'investointihanke' && (
              <InvestmentProjectObjectForm
                ref={tabRefs.form}
                userIsOwner={isOwner}
                userCanWrite={canWrite}
                projectId={routeParams.projectId}
                projectType={props.projectType}
                projectObject={projectObject.data}
                setProjectId={setProjectId}
              />
            )}
            {props.projectType === 'kunnossapitohanke' && (
              <MaintenanceProjectObjectForm
                ref={tabRefs.form}
                userIsOwner={isOwner}
                userCanWrite={canWrite}
                projectId={routeParams.projectId}
                projectType={props.projectType}
                projectObject={projectObject.data}
                setProjectId={setProjectId}
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
                  ref={tabRefs.map}
                  onGeometrySave={async (features) => {
                    await geometryUpdate.mutateAsync({ projectObjectId, features });
                  }}
                  drawOptions={{
                    geoJson: projectObject?.data?.geometryDump ?? null,
                    drawStyle: PROJ_OBJ_DRAW_STYLE,
                    editable: editing && (!projectObjectId || isOwner || canWrite),
                  }}
                  vectorLayers={[projectLayer, projectObjectLayer]}
                  fitExtent="all"
                  projectObjects={
                    projectObjects.data
                      ?.filter((obj) => obj.projectObjectId !== projectObjectId)
                      .map((obj) => ({
                        ...obj,
                        project: {
                          projectId: projectId,
                          projectName: project.data?.projectName ?? '',
                          projectType: project.data?.projectType,
                          coversMunicipality: project.data?.coversMunicipality ?? false,
                        },
                      })) ?? []
                  }
                  interactiveLayers={['projectObjects', 'projects']}
                  projects={project.data ? [project.data] : []}
                />
              </Box>
            )}

            {searchParams.get('tab') && (
              <Box sx={{ m: 2, overflowY: 'auto' }}>
                {searchParams.get('tab') === 'talous' && projectObject.data && (
                  <ProjectObjectFinances
                    ref={tabRefs.finances}
                    {...(props.projectType === 'kunnossapitohanke' && {
                      onSave: () => {
                        document.dispatchEvent(new Event('budgetUpdated'));
                      },
                    })}
                    userIsAdmin={isAdmin(user.role)}
                    userIsEditor={isOwner || canWrite}
                    userIsFinanceEditor={hasPermission(
                      user,
                      props.projectType === 'investointihanke'
                        ? 'investmentFinancials.write'
                        : 'maintenanceFinancials.write',
                    )}
                    projectObject={{
                      data: projectObject.data,
                      projectType:
                        props.projectType === 'investointihanke'
                          ? 'investmentProject'
                          : 'maintenaceProject',
                    }}
                  />
                )}
                {searchParams.get('tab') === 'vaiheet' && (
                  <Tasks
                    isOwner={isOwner}
                    canWrite={canWrite}
                    projectObjectId={projectObjectId}
                    canEditFinances={hasPermission(
                      user,
                      props.projectType === 'investointihanke'
                        ? 'investmentFinancials.write'
                        : 'maintenanceFinancials.write',
                    )}
                  />
                )}
              </Box>
            )}
          </Paper>
        </div>
      )}
    />
  );
}
