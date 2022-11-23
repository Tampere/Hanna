import { css } from '@emotion/react';
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Paper, Typography } from '@mui/material';
import { useLoaderData } from 'react-router';

import { trpc } from '@frontend/client';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { useTranslations } from '@frontend/stores/lang';

import { DeleteProjectDialog } from './DeleteProjectDialog';
import { ProjectForm } from './ProjectForm';

const pageStyle = css`
  display: grid;
  grid-template-columns: minmax(384px, 1fr) minmax(512px, 2fr);
  gap: 16px;
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

  const routeParams = useLoaderData() as { projectId: string };
  const projectId = routeParams?.projectId;
  const project = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId), queryKey: ['project.get', { id: projectId }] }
  );

  if (projectId && project.isLoading) {
    return <Typography>{tr('loading')}</Typography>;
  }

  if (project.isError && project.error.data?.code === 'NOT_FOUND') {
    return <Typography>{tr('project.notFound')}</Typography>;
  }

  return (
    <div css={pageStyle}>
      <Paper elevation={2} css={infobarRootStyle}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {project?.data?.projectName ?? tr('newProject.formTitle')}
        </Typography>
        <Accordion expanded={true}>
          <AccordionSummary css={accordionSummaryStyle} expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.basicInfoSectionLabel')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <ProjectForm project={project.data} />
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.linksSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.documentsSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>

        <Accordion expanded={false} disabled>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="overline">{tr('newProject.decisionsSectionTitle')}</Typography>
          </AccordionSummary>
        </Accordion>
        {project.data && <DeleteProjectDialog projectId={project.data.id} />}
      </Paper>

      <Paper elevation={2} css={mapContainerStyle}>
        <MapWrapper />
      </Paper>
    </div>
  );
}
