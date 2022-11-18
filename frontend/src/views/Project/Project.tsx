import { css } from '@emotion/react';
import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';
import { useLoaderData, useNavigate } from 'react-router';

import { trpc } from '@frontend/client';
import { MapWrapper } from '@frontend/components/Map/MapWrapper';
import { useTranslations } from '@frontend/stores/lang';

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
  const navigate = useNavigate();

  const routeParams = useLoaderData() as { projectId: string };
  const projectId = routeParams?.projectId;
  const project = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: Boolean(projectId), queryKey: ['project.get', { id: projectId }] }
  );

  const projectDeleteMutation = trpc.project.delete.useMutation({
    onSuccess: (data) => {
      console.log(data);
      navigate(`/hankkeet`);
    },
    onError: () => {
      console.log('error');
      navigate(`/hankkeet`);
    },
  });

  const onDelete = async (id: string) => projectDeleteMutation.mutate({ id });

  if (projectId && !project.data) {
    return <Typography>{tr('loading')}</Typography>;
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
        <Button
          variant="contained"
          color="error"
          onClick={() => onDelete(String(project.data?.id))}
        >
          Poista hanke
        </Button>
      </Paper>

      <Paper elevation={2} css={mapContainerStyle}>
        <MapWrapper />
      </Paper>
    </div>
  );
}
