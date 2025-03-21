import { css } from '@emotion/react';
import { Assignment, Euro, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import VectorSource from 'ol/source/Vector';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Link, useSearchParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { DrawMap } from '@frontend/components/Map/DrawMap';
import { getProjectObjectGeoJSON } from '@frontend/components/Map/mapFunctions';
import { featuresFromGeoJSON } from '@frontend/components/Map/mapInteractions';
import { PROJ_OBJ_DRAW_STYLE } from '@frontend/components/Map/styles';
import { TooltipLinkTab } from '@frontend/components/TooltipLinkTab';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { getProjectObjectsLayer, getProjectsLayer } from '@frontend/stores/map';
import { projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectTypePath } from '@frontend/types';
import { TaskList } from '@frontend/views/Task/TaskList';

import { TranslationKey } from '@shared/language';
import {
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';

import { ProjectViewMainContentWrapper } from '../Project/ProjectViewMainContentWrapper';
import { ProjectViewWrapper } from '../Project/ProjectViewWrapper';
import { InvestmentProjectObjectForm } from './InvestmentProjectObjectForm';
import { MaintenanceProjectObjectForm } from './MaintenanceProjectObjectForm';
import { ProjectObjectFinances } from './ProjectObjectFinances';
import { ProjectObjectFinancesCharts } from './ProjectObjectFinancesCharts';

type TabView = 'default' | 'talous' | 'kuluseuranta' | 'vaiheet';

interface Tab {
  tabView: TabView;
  url: string;
  label: TranslationKey;
  icon: ReactElement;
}

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
      tabView: 'kuluseuranta',
      url: `/${projectType}/${projectId}/kohde/${projectObjectId}?tab=kuluseuranta`,
      label: 'project.chartTabLabel',
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
  const { pathname } = useLocation();

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

  const [savedProjectId, setSavedProjectId] = useState(routeParams.projectId);

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

  const project = trpc.project.get.useQuery(
    { projectId: savedProjectId },
    { enabled: Boolean(savedProjectId) },
  );
  const projectObjectGeometries = trpc.projectObject.getGeometriesByProjectId.useQuery(
    { projectId: savedProjectId },
    { enabled: Boolean(savedProjectId) },
  );

  useEffect(() => {
    if (savedProjectId !== routeParams.projectId) {
      project.refetch();
      setSavedProjectId(routeParams.projectId);
    }
  }, [routeParams.projectId]);

  useEffect(() => {
    projectObjectGeometries.refetch();
  }, [pathname]);

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
    return getProjectObjectsLayer(projectObjectSource, true);
  }, [projectObjectGeometries.data, projectObjectId]);

  const projectLayer = useMemo(() => {
    return getProjectsLayer(projectSource);
  }, [project.data]);

  const vectorLayers = useMemo(
    () => [projectLayer, projectObjectLayer],
    [projectLayer, projectObjectLayer],
  );

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
            max-width: 80%;
            overflow-x: hidden;
            text-overflow: ellipsis;
            & .MuiChip-root {
              max-width: 60vw;
            }
          `}
        >
          <Breadcrumbs
            css={css`
              margin-bottom: 8px;
            `}
          >
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
        <ProjectViewMainContentWrapper
          formWidth={540}
          renderForm={() => {
            if (props.projectType === 'investointihanke') {
              return (
                <InvestmentProjectObjectForm
                  ref={tabRefs.form}
                  userIsOwner={isOwner}
                  userCanWrite={canWrite}
                  projectId={routeParams.projectId}
                  projectType={props.projectType}
                  projectObject={projectObject.data}
                  setProjectId={setSavedProjectId}
                />
              );
            } else if (props.projectType === 'kunnossapitohanke') {
              return (
                <MaintenanceProjectObjectForm
                  ref={tabRefs.form}
                  userIsOwner={isOwner}
                  userCanWrite={canWrite}
                  projectId={routeParams.projectId}
                  projectType={props.projectType}
                  projectObject={projectObject.data}
                  setProjectId={setSavedProjectId}
                />
              );
            } else {
              return null;
            }
          }}
        >
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
              css={css`
                min-height: ${editing ? 0 : 48}px;
                height: ${editing ? 0 : 48}px;
                transition:
                  min-height 0.2s,
                  height 0.2s;
              `}
              value={tabIndex}
              indicatorColor="primary"
              textColor="primary"
              TabIndicatorProps={{ sx: { height: '5px' } }}
            >
              {tabs.map((tab) => {
                const projectObjectInFuture =
                  dayjs(projectObject.data?.startDate).year() > dayjs().year();
                if (tab.tabView === 'vaiheet' && !projectObject.data?.sapWBSId) {
                  return (
                    <TooltipLinkTab
                      title={tr('projectObject.tabLabelDisabledNoWbs')}
                      disabled={true}
                      key={tab.tabView}
                      to={tab.url}
                      component={Link}
                      icon={tab.icon}
                      iconPosition="end"
                      label={tr(tab.label)}
                    />
                  );
                }

                if (
                  tab.tabView === 'kuluseuranta' &&
                  (!projectObject.data?.sapWBSId || projectObjectInFuture)
                ) {
                  return (
                    <TooltipLinkTab
                      title={
                        projectObjectInFuture
                          ? tr('projectObject.tabLabelNotStarted')
                          : tr('projectObject.tabLabelDisabledNoWbs')
                      }
                      disabled={true}
                      key={tab.tabView}
                      to={tab.url}
                      component={Link}
                      icon={tab.icon}
                      iconPosition="end"
                      label={tr(tab.label)}
                    />
                  );
                }
                return (
                  <Tab
                    disabled={!projectObject.data}
                    key={tab.tabView}
                    component={Link}
                    to={tab.url}
                    label={tr(tab.label)}
                    icon={tab.icon}
                    iconPosition="end"
                  />
                );
              })}
            </Tabs>

            {!searchParams.get('tab') && (
              <DrawMap
                ref={tabRefs.map}
                onGeometrySave={async (features) => {
                  return geometryUpdate.mutateAsync({ projectObjectId, features });
                }}
                initialMapDataLoading={
                  Boolean(savedProjectId) && (project.isLoading || projectObjects.isLoading)
                }
                drawOptions={{
                  coversMunicipality: false,
                  drawGeom: {
                    isLoading: Boolean(projectObjectId) && projectObject.isLoading,
                    isFetching: projectObject.isFetching,
                    geoJson:
                      (editing ? projectObject.data?.geometryDump : projectObject.data?.geom) ??
                      null,
                  },
                  drawStyle: PROJ_OBJ_DRAW_STYLE,
                  editable: editing && (!projectObjectId || isOwner || canWrite),
                  drawItemType: 'projectObject',
                }}
                vectorLayers={vectorLayers}
                projectObjects={
                  projectObjects.data
                    ?.filter((obj) => obj.projectObjectId !== projectObjectId)
                    .map((obj) => ({
                      ...obj,
                      project: {
                        projectId: savedProjectId,
                        projectName: project.data?.projectName ?? '',
                        projectType: project.data?.projectType,
                        coversMunicipality: project.data?.coversMunicipality ?? false,
                      },
                    })) ?? []
                }
                interactiveLayers={['projectObjects', 'projects']}
                projects={project.data ? [project.data] : []}
              />
            )}
            {searchParams.get('tab') && (
              <Box sx={{ m: 2, overflowY: 'auto' }}>
                {searchParams.get('tab') === 'talous' && projectObject.data && (
                  <ProjectObjectFinances
                    ref={tabRefs.finances}
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
                {searchParams.get('tab') === 'kuluseuranta' && (
                  <ProjectObjectFinancesCharts
                    projectObjectId={projectObjectId}
                    startYear={dayjs(projectObject.data?.startDate).year()}
                    endYear={
                      props.projectType === 'kunnossapitohanke' &&
                      projectObject.data?.endDate === 'infinity'
                        ? dayjs().year() + 5
                        : dayjs(projectObject.data?.endDate).year()
                    }
                  />
                )}
                {searchParams.get('tab') === 'vaiheet' && (
                  <TaskList projectObjectId={projectObjectId} />
                )}
              </Box>
            )}
          </Paper>
        </ProjectViewMainContentWrapper>
      )}
    />
  );
}
