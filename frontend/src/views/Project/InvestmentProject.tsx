import { css } from '@emotion/react';
import { AccountTree, BarChart, Euro, KeyTwoTone, ListAlt, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useQueries } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import VectorSource from 'ol/source/Vector';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { DrawMap } from '@frontend/components/Map/DrawMap';
import {
  addFeaturesFromGeoJson,
  featuresFromGeoJSON,
  getGeoJSONFeaturesString,
} from '@frontend/components/Map/mapInteractions';
import { mapOptions, treMunicipalityGeometry } from '@frontend/components/Map/mapOptions';
import { projectAreaStyle } from '@frontend/components/Map/styles';
import { TooltipLinkTab } from '@frontend/components/TooltipLinkTab';
import { useNotifications } from '@frontend/services/notification';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import {
  getProjectMunicipalityLayer,
  getProjectObjectsLayer,
  mapProjectionAtom,
} from '@frontend/stores/map';
import { projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectRelations } from '@frontend/views/Project/ProjectRelations';
import { ProjectObjectList } from '@frontend/views/ProjectObject/ProjectObjectList';

import { User } from '@shared/schema/user';
import {
  ProjectPermissionContext,
  hasPermission,
  hasWritePermission,
  isAdmin,
  ownsProject,
} from '@shared/schema/userPermissions';
import { YearBudget } from '@shared/schema/projectObject/base';

import { BudgetField } from './BudgetTable';

import { InvestmentProjectForm } from './InvestmentProjectForm';
import { ProjectAreaSelectorForm } from './ProjectAreaSelectorForm';
import { ProjectFinances } from './ProjectFinances';
import { ProjectFinancesCharts } from './ProjectFinancesCharts';
import { ProjectPermissions } from './ProjectPermissions';
import { ProjectViewMainContentWrapper } from './ProjectViewMainContentWrapper';
import { ProjectViewWrapper } from './ProjectViewWrapper';

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
      tabView: 'kuluseuranta',
      url: `/investointihanke/${projectId}?tab=kuluseuranta`,
      label: 'project.chartTabLabel',
      icon: <BarChart fontSize="small" />,
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
  const tabView = searchParams.get('tab') || 'default';
  const user = useAtomValue(asyncUserAtom);
  const mapProjection = useAtomValue(mapProjectionAtom);
  const editing = useAtomValue(projectEditingAtom);

  const projectId = routeParams?.projectId;
  const project = trpc.investmentProject.get.useQuery(
    { projectId },
    { enabled: Boolean(projectId), queryKey: ['investmentProject.get', { projectId }] },
  );

  const [coversMunicipality, setCoversMunicipality] = useState(
    project.data?.coversMunicipality ?? false,
  );

  const userCanModify = Boolean(
    project.data &&
      user &&
      (ownsProject(user, project.data) || hasWritePermission(user, project.data)),
  );

  function getProjectWritableFields(): BudgetField[] {
    if (!user || !project.data) return [];

    const userIsAdmin = isAdmin(user.role);
    const isOwner = ownsProject(user, project.data);
    const canWrite = hasWritePermission(user, project.data);
    const isFinanceEditor = hasPermission(user, 'investmentFinancials.write');

    if (userIsAdmin) {
      return ['estimate', 'contractPrice', 'amount', 'forecast', 'kayttosuunnitelmanMuutos'];
    } else if (isOwner || canWrite) {
      if (isFinanceEditor) {
        return ['estimate', 'contractPrice', 'amount', 'forecast', 'kayttosuunnitelmanMuutos'];
      }
      return ['estimate', 'contractPrice', 'forecast'];
    } else if (isFinanceEditor) {
      return ['amount', 'kayttosuunnitelmanMuutos'];
    } else {
      return [];
    }
  }

  const tabs = getTabs(routeParams.projectId).filter(
    (tab) => project?.data && user && tab.hasAccess(user, project.data),
  );
  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

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

  const poIds = useMemo(
    () => projectObjects.data?.map((po) => po.projectObjectId) ?? [],
    [projectObjects.data],
  );

  const utils = trpc.useUtils();

  const projectObjectBudgetQueries = useQueries({
    queries: poIds.map((id) => ({
      queryKey: ['projectObject.getBudget', { projectObjectId: id }],
      queryFn: () => utils.projectObject.getBudget.fetch({ projectObjectId: id }),
      enabled: Boolean(id) && tabView === 'talous',
      staleTime: 5 * 60 * 1000,
    })),
  });

  const projectObjectBudgetsById = useMemo(() => {
    const map: Record<string, YearBudget[]> = {};
    projectObjectBudgetQueries.forEach((q, idx) => {
      const id = poIds[idx];
      if (id && q.data) {
        map[id] = q.data as YearBudget[];
      }
    });
    return map;
  }, [
    poIds.join(','),
    projectObjectBudgetQueries.map((q) => q.dataUpdatedAt).join(','),
  ]);

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
    return layer;
  }, [projectObjects.data]);

  const municipalityGeometrySource = useMemo(() => {
    const source = new VectorSource();
    const features = featuresFromGeoJSON(treMunicipalityGeometry);
    source.addFeature(features[0]);
    return source;
  }, []);

  const municipalityGeometryLayer = useMemo(() => {
    return getProjectMunicipalityLayer(municipalityGeometrySource);
  }, [municipalityGeometrySource]);

  const drawSource = useMemo(() => new VectorSource({ wrapX: false }), []);

  const vectorLayers = useMemo(
    () => [...(coversMunicipality ? [municipalityGeometryLayer] : []), projectObjectsLayer],
    [projectObjectsLayer, coversMunicipality, municipalityGeometryLayer],
  );

  useEffect(() => {
    if (project.data) {
      const { coversMunicipality } = project.data;
      setCoversMunicipality(coversMunicipality);
    }
  }, [project.data]);

  function mapIsEditable() {
    if (coversMunicipality) return false;
    return !projectId || userCanModify;
  }

  function handleFormCancel(formRef: React.RefObject<{ onCancel: () => void }>) {
    if (formRef.current?.onCancel) {
      formRef.current?.onCancel();
      addFeaturesFromGeoJson(drawSource, project?.data?.geom ?? null);
    }
  }

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
    <ProjectViewWrapper
      permissionCtx={
        project.data ? { owner: project.data?.owner, writeUsers: project.data?.writeUsers } : null
      }
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
          <Breadcrumbs>
            {project.data ? (
              <Chip label={project.data?.projectName} />
            ) : (
              <Chip variant="outlined" label={tr('newInvestmentProject.formTitle')} />
            )}
          </Breadcrumbs>
        </Box>
      )}
      renderMainContent={(tabRefs) => (
        <ProjectViewMainContentWrapper
          renderForm={() => (
            <InvestmentProjectForm
              ref={tabRefs.form}
              project={project.data}
              coversMunicipality={coversMunicipality}
              setCoversMunicipality={setCoversMunicipality}
              getDrawGeometry={() => {
                return getGeoJSONFeaturesString(
                  drawSource.getFeatures(),
                  mapProjection?.getCode() ?? mapOptions.projection.code,
                );
              }}
              onCancel={() => {
                addFeaturesFromGeoJson(drawSource, project?.data?.geom ?? null);
              }}
            />
          )}
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
            <Box
              css={css`
                min-height: ${editing ? 60 : 48}px;
                height: ${editing ? 60 : 48}px;
                transition:
                  min-height 0.2s 0.1s,
                  height 0.2s 0.1s;
              `}
            >
              {tabView === 'default' && (!projectId || editing) && (
                <ProjectAreaSelectorForm
                  forNewProject={Boolean(projectId)}
                  checked={coversMunicipality}
                  projectHasGeom={Boolean(project.data?.geom)}
                  onChange={async (isChecked) => setCoversMunicipality(isChecked)}
                />
              )}
              {tabs.length > 0 && !editing && (
                <Tabs
                  value={tabIndex}
                  indicatorColor="primary"
                  textColor="primary"
                  TabIndicatorProps={{ sx: { height: '5px' } }}
                  css={css`
                    outline: ${tabView === 'talous' ? '1px solid #e0e0e0' : 'none'};
                  `}
                >
                  {tabs.map((tab) => {
                    const projectInFuture = dayjs(project.data?.startDate).year() > dayjs().year();
                    if (
                      tab.tabView === 'kuluseuranta' &&
                      (!project.data?.sapProjectId || projectInFuture)
                    ) {
                      return (
                        <TooltipLinkTab
                          title={
                            projectInFuture
                              ? tr('project.chartTabLabelNotStarted')
                              : tr('project.chartTabLabelDisabled')
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
                        disabled={!project.data}
                        key={tab.tabView}
                        component={Link}
                        to={tab.url}
                        icon={tab.icon}
                        iconPosition="end"
                        label={tr(tab.label)}
                      />
                    );
                  })}
                </Tabs>
              )}
            </Box>

            {tabView === 'default' && (
              <DrawMap
                ref={tabRefs.map}
                onGeometrySave={async (features) => {
                  return geometryUpdate.mutateAsync({ projectId, features });
                }}
                initialMapDataLoading={
                  Boolean(projectId) && (project.isLoading || projectObjects.isLoading)
                }
                vectorLayers={vectorLayers}
                drawOptions={{
                  coversMunicipality: coversMunicipality,
                  toolsHidden: ['newPointFeature'],
                  drawGeom: {
                    isLoading: Boolean(projectId) && project.isLoading,
                    isFetching: project.isFetching,
                    geoJson: (editing ? project?.data?.geometryDump : project?.data?.geom) ?? null,
                  },
                  drawStyle: projectAreaStyle(undefined, undefined, false),
                  editable: editing && mapIsEditable(),
                  drawItemType: 'project',
                }}
                projectObjects={
                  projectObjects.data?.map((obj) => ({
                    ...obj,
                    objectStage: obj.objectStage ?? '',
                    project: {
                      projectId: projectId,
                      projectName: project.data?.projectName ?? '',
                      projectType: 'investmentProject',
                      coversMunicipality: project.data?.coversMunicipality ?? false,
                    },
                  })) ?? []
                }
                drawSource={drawSource}
              />
            )}

            {tabView !== 'default' && (
              <Box sx={{ m: 2, overflowY: 'auto' }}>
                {tabView === 'talous' && (
                  <ProjectFinances
                    ref={tabRefs.finances}
                    editable={userCanModify}
                    project={{ type: 'investmentProject', data: project.data }}
                    writableFields={getProjectWritableFields()}
                    projectObjects={
                      projectObjects.data
                        ? projectObjects.data.map((obj) => {
                            const budgets = projectObjectBudgetsById[obj.projectObjectId];

                            if (!budgets || budgets.length === 0) {
                              return { ...obj, budgetUpdate: null };
                            }

                            const budgetItems = budgets
                              .filter(
                                (b): b is YearBudget & { committee: string } =>
                                  Boolean(b.committee),
                              )
                              .map((b) => ({
                                year: b.year,
                                committee: b.committee,
                                estimate: b.budgetItems.estimate,
                                contractPrice: b.budgetItems.contractPrice,
                                amount: b.budgetItems.amount,
                                forecast: b.budgetItems.forecast,
                                kayttosuunnitelmanMuutos:
                                  b.budgetItems.kayttosuunnitelmanMuutos,
                              }));

                            return {
                              ...obj,
                              budgetUpdate:
                                budgetItems.length > 0
                                  ? {
                                      projectObjectId: obj.projectObjectId,
                                      budgetItems,
                                    }
                                  : null,
                            };
                          })
                        : []
                    }
                  />
                )}
                {tabView === 'kuluseuranta' && (
                  <ProjectFinancesCharts
                    projectId={projectId}
                    startYear={dayjs(project.data?.startDate).year()}
                    endYear={dayjs(project.data?.endDate).year()}
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
                    ref={tabRefs.permissions}
                    projectId={routeParams.projectId}
                    ownerId={project.data?.owner}
                  />
                )}
              </Box>
            )}
          </Paper>
        </ProjectViewMainContentWrapper>
      )}
    />
  );
}
