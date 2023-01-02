import { css } from '@emotion/react';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { useLoaderData } from 'react-router';

import { trpc } from '@frontend/client';
import { ErrorPage } from '@frontend/components/ErrorPage';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { useNotifications } from '@frontend/services/notification';
import { useTranslations } from '@frontend/stores/lang';

import { DbProject } from '@shared/schema/project';

import { DeleteProjectDialog } from './DeleteProjectDialog';
import { ProjectFinances } from './ProjectFinances';
import { ProjectForm } from './ProjectForm';
import { ProjectRelations } from './ProjectRelations';

const pageStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
  height: 100%;
  overflow: scroll;
`;

const infobarRootStyle = css`
  padding: 16px;
`;

const mapContainerStyle = css`
  min-height: 600px;
`;

const accordionSummaryStyle = css`
  background: #eee;
  border: 1px solid #ccc;
`;

export function Project() {
  const tr = useTranslations();
  const [financeSectionExpanded, setFinanceSectionExpanded] = useState(false);

  const [expanded, setExpanded] = useState<string | false>('basicInfoSection');
  const routeParams = useLoaderData() as { projectId: string };
  const notify = useNotifications();
  const projectId = routeParams?.projectId;
  const project = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId), queryKey: ['project.get', { id: projectId }] }
  );

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

  if (project.isError) {
    return (
      <ErrorPage
        severity="warning"
        message={
          project.error.data?.code === 'NOT_FOUND' ? tr('project.notFound') : tr('unknownError')
        }
      />
    );
  }

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <div css={pageStyle}>
      <Paper elevation={2} css={infobarRootStyle}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {project?.data?.projectName ?? tr('newProject.formTitle')}
        </Typography>
        <Accordion
          expanded={expanded === 'basicInfoSection'}
          onChange={handleChange('basicInfoSection')}
        >
          <AccordionSummary css={accordionSummaryStyle} expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.basicInfoSectionLabel')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ProjectForm project={project.data} />
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded === 'relationSection'}
          onChange={handleChange('relationSection')}
        >
          <AccordionSummary css={accordionSummaryStyle} expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.linksSectionTitle')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ProjectRelations project={project.data as DbProject} />
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.documentsSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion
          expanded={financeSectionExpanded}
          onChange={(_, expanded) => setFinanceSectionExpanded(expanded)}
          disabled={!project.data}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.financeSectionTitle')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ProjectFinances project={project.data} />
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.decisionsSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>
        {project.data && <DeleteProjectDialog projectId={project.data.id} />}
      </Paper>

      <Paper elevation={2} css={mapContainerStyle}>
        <MapWrapper
          geoJson={project?.data?.geom}
          editable={Boolean(projectId)}
          onFeaturesSaved={(features) => {
            geometryUpdate.mutate({ id: projectId, features: features });
          }}
        />
      </Paper>
    </div>
  );
}
