import { AccountTree, KeyTwoTone, Mail, Map } from '@mui/icons-material';
import { Box, Breadcrumbs, Chip, Paper, Tab, Tabs, Typography, css } from '@mui/material';
import { useAtomValue } from 'jotai';
import { ReactElement } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { DrawMap } from '@frontend/components/Map/DrawMap';
import { projectAreaStyle } from '@frontend/components/Map/styles';
import { asyncUserAtom } from '@frontend/stores/auth';
import { useTranslations } from '@frontend/stores/lang';
import { projectEditingAtom } from '@frontend/stores/projectView';
import { ProjectRelations } from '@frontend/views/Project/ProjectRelations';

import { TranslationKey } from '@shared/language';
import { User } from '@shared/schema/user';
import {
  ProjectPermissionContext,
  hasWritePermission,
  ownsProject,
} from '@shared/schema/userPermissions';

import { ProjectPermissions } from '../Project/ProjectPermissions';
import { ProjectViewMainContentWrapper } from '../Project/ProjectViewMainContentWrapper';
import { ProjectViewWrapper } from '../Project/ProjectViewWrapper';
import { DetailplanProjectForm } from './DetailplanProjectForm';
import { DetailplanProjectNotification } from './DetailplanProjectNotification';

type TabView = 'default' | 'sidoshankkeet' | 'tiedotus' | 'luvitus';

interface Tab {
  tabView: TabView;
  url: string;
  label: TranslationKey;
  icon: ReactElement;
}

function getTabs(projectId: string) {
  return [
    {
      tabView: 'default',
      url: `/asemakaavahanke/${projectId}`,
      label: 'project.mapTabLabel',
      icon: <Map fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'sidoshankkeet',
      url: `/asemakaavahanke/${projectId}?tab=sidoshankkeet`,
      label: 'project.relatedProjectsTabLabel',
      icon: <AccountTree fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'tiedotus',
      url: `/asemakaavahanke/${projectId}?tab=tiedotus`,
      label: 'detailplanProject.notification',
      icon: <Mail fontSize="small" />,
      hasAccess: () => true,
    },
    {
      tabView: 'luvitus',
      url: `/asemakaavahanke/${projectId}?tab=luvitus`,
      label: 'project.permissionsTabLabel',
      icon: <KeyTwoTone fontSize="small" />,
      hasAccess: (user: User, project: ProjectPermissionContext) =>
        ownsProject(user, project) || hasWritePermission(user, project),
    },
  ] as const;
}

export function DetailplanProject() {
  const routeParams = useParams() as { projectId: string };
  const [searchParams] = useSearchParams();

  const tabView = searchParams.get('tab') || 'default';
  const projectId = routeParams?.projectId;
  const user = useAtomValue(asyncUserAtom);
  const editing = useAtomValue(projectEditingAtom);

  const project = trpc.detailplanProject.get.useQuery(
    { projectId },
    {
      enabled: Boolean(projectId),
      queryKey: ['detailplanProject.get', { projectId }],
      staleTime: Infinity,
    },
  );

  const tabs = getTabs(routeParams.projectId).filter(
    (tab) => project?.data && user && tab.hasAccess(user, project.data),
  );

  const tr = useTranslations();

  const userCanModify = Boolean(
    user &&
      project?.data &&
      (ownsProject(user, project.data) || hasWritePermission(user, project.data)),
  );

  const tabIndex = tabs.findIndex((tab) => tab.tabView === tabView);

  function handleFormCancel(formRef: React.RefObject<{ onCancel: () => void }>) {
    formRef.current?.onCancel();
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
      projectType="asemakaavahanke"
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
          <Breadcrumbs sx={{ mb: 1 }}>
            {project.data ? (
              <Chip label={project.data?.projectName} />
            ) : (
              <Chip variant="outlined" label={tr('newDetailplanProject.formTitle')} />
            )}
          </Breadcrumbs>
        </Box>
      )}
      renderMainContent={(tabRefs) => (
        <ProjectViewMainContentWrapper
          renderForm={() => <DetailplanProjectForm ref={tabRefs.form} project={project.data} />}
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
            {
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
            }

            {tabView === 'default' && (
              <DrawMap
                initialMapDataLoading={Boolean(projectId) && project.isLoading}
                drawOptions={{
                  drawItemType: 'project',
                  drawGeom: {
                    isLoading: Boolean(projectId) && project.isLoading,
                    isFetching: project.isFetching,
                    geoJson: project.data?.geom ?? null,
                  },
                  drawStyle: projectAreaStyle(undefined, undefined, false),
                  editable: false,
                }}
              />
            )}

            {tabView !== 'default' && (
              <Box sx={{ m: 2, overflowY: 'auto' }}>
                {tabView === 'sidoshankkeet' && (
                  <ProjectRelations editable={userCanModify} projectId={routeParams.projectId} />
                )}
                {tabView === 'tiedotus' && (
                  <DetailplanProjectNotification
                    enabled={Boolean(user && project.data && ownsProject(user, project.data))}
                    projectId={routeParams.projectId}
                  />
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
