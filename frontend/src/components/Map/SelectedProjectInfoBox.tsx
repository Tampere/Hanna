import { ChevronRight, NavigateBefore, NavigateNext } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { Alert, Box, Button, CircularProgress, IconButton, Typography, css } from '@mui/material';
import dayjs from 'dayjs';
import { useAtom, useAtomValue } from 'jotai';
import { Pixel } from 'ol/pixel';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectSearchResult } from 'tre-hanna-shared/src/schema/project';

import { trpc } from '@frontend/client';
import { langAtom, useTranslations } from '@frontend/stores/lang';
import { activeProjectIdAtom, selectedProjectIdsAtom } from '@frontend/stores/map';
import { useCodes } from '@frontend/utils/codes';

import { ProjectType } from '@shared/schema/project/type';

interface ProjectDetailsProps<TProject> {
  project: TProject;
}

interface ProjectBase {
  projectId: string;
  projectName: string;
  projectType: ProjectType;
}

function ProjectDetails<TProject extends ProjectBase>({ project }: ProjectDetailsProps<TProject>) {
  const lang = useAtomValue(langAtom);
  const tr = useTranslations();

  const users = trpc.user.getAllNonExt.useQuery();

  function getUser(userId: string) {
    return users.data?.find((user) => user.id === userId);
  }

  const projectDetails =
    project.projectType === 'investmentProject'
      ? trpc.investmentProject.get.useQuery({ projectId: project.projectId })
      : trpc.detailplanProject.get.useQuery({ projectId: project.projectId });

  const lifecycleStateCodes = useCodes('KohteenElinkaarentila');
  const committeeCodes = useCodes('Lautakunta');

  if (projectDetails.isLoading || projectDetails.isError) {
    return (
      <Box
        css={css`
          width: 100%;
          height: 90px;
          margin: 12px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        {projectDetails.isLoading && <CircularProgress />}
        {projectDetails.isError && (
          <Alert severity="error" variant="outlined">
            {tr('genericError')}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <dl
      css={css`
        width: 270px;
        display: grid;
        column-gap: 0.5rem;
        grid-template-columns: 1fr 2fr;
        font-size: 0.75rem;
        padding: 0;
        white-space: nowrap;
        & dt {
          grid-column: 1;
          font-weight: bold;
          color: #777777;
        }
        & dd {
          grid-column: 2;
          justify-self: start;
          margin: 0;
        }
      `}
    >
      <dt>{tr('projectInfoBox.dateRange')}: &nbsp;</dt>
      <dd>
        {dayjs(projectDetails.data.startDate).format(tr('date.format'))} –{' '}
        {dayjs(projectDetails.data.endDate).format(tr('date.format'))}
      </dd>
      <dt>{tr('projectInfoBox.lifecycleState')}:</dt>
      <dd>{lifecycleStateCodes.get(projectDetails.data.lifecycleState)?.[lang]}</dd>
      <dt>{tr('projectInfoBox.owner')}:</dt>
      <dd>{getUser(projectDetails.data.owner)?.name}</dd>
      <dt>{tr('projectInfoBox.projectType')}:</dt>
      <dd>{tr(`projectType.${project.projectType}.short`)}</dd>
      <dt>{tr('projectInfoBox.committee')}:</dt>
      <dd>{committeeCodes.get(projectDetails.data.committees[0])?.[lang]}</dd>
    </dl>
  );
}

function StepIndicator({ steps, activeStep }: { steps: number; activeStep: number }) {
  const MAX_STEPS = 25;

  return (
    <Box
      css={css`
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.5rem;
        height: 8px;
      `}
    >
      {Array.from({ length: steps }).map((_, currentStep) => {
        const remainingSteps = steps - (activeStep + 1);
        let cutOffIndex: number | null = null;

        if (steps > MAX_STEPS) {
          if (activeStep === 0 || activeStep <= remainingSteps) {
            cutOffIndex = MAX_STEPS - 1;
          } else {
            cutOffIndex = steps - MAX_STEPS;
          }
        }

        if (cutOffIndex !== null) {
          if (cutOffIndex === MAX_STEPS - 1 && currentStep > cutOffIndex) {
            return null;
          } else if (cutOffIndex === steps - MAX_STEPS && currentStep < cutOffIndex) {
            return null;
          }
        }

        return (
          <div
            key={currentStep}
            css={(theme) => css`
              background-color: ${activeStep === currentStep
                ? theme.palette.primary.main
                : '#00000033'};
              border-radius: 50%;
              width: ${activeStep === currentStep
                ? '8px'
                : currentStep === cutOffIndex
                  ? '2px'
                  : '4px'};
              height: ${activeStep === currentStep
                ? '8px'
                : currentStep === cutOffIndex
                  ? '2px'
                  : '4px'};
              margin: 0 2px;
              -webkit-transition:
                background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
                width 150ms,
                height 150ms;
              transition:
                background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,
                width 150ms,
                height 150ms;
            `}
          />
        );
      })}
    </Box>
  );
}

interface Props {
  parentHeight: number;
  parentWidth: number;
  handleActiveFeatureChange: (projectId: string) => void;
  pos: Pixel;
  handleCloseInfoBox: () => void;
  projects: ProjectSearchResult['projects'];
}

export function SelectedProjectInfoBox({
  parentHeight,
  parentWidth,
  handleActiveFeatureChange,
  pos,
  handleCloseInfoBox,
  ...props
}: Props) {
  const tr = useTranslations();
  const selectedProjectIds = useAtomValue(selectedProjectIdsAtom);
  const [activeProjectId, setActiveProjectId] = useAtom(activeProjectIdAtom);
  const [projects, setProjects] = useState<ProjectSearchResult['projects']>([]);

  useEffect(() => {
    // Doing this the hard way instead of props.projects.filter... to keep the order of the projects right
    setProjects(
      selectedProjectIds
        .map((projectId) => props.projects.find((project) => project.projectId === projectId))
        .filter<ProjectSearchResult['projects'][number]>(
          (project): project is ProjectSearchResult['projects'][number] =>
            typeof project !== 'undefined',
        ),
    );
  }, [props.projects, selectedProjectIds]);

  function getActiveProjectIndex() {
    const index = projects?.findIndex((project) => project.projectId === activeProjectId) ?? 0;
    if (index === -1) return 0;
    return index;
  }

  const activeProjectIndex = getActiveProjectIndex();

  const toolbarStyle = css`
    box-shadow:
      0px 3px 5px -1px rgba(0, 0, 0, 0.2),
      0px 5px 8px 0px rgba(0, 0, 0, 0.14),
      0px 1px 14px 0px rgba(0, 0, 0, 0.12);
    position: absolute;
    top: ${pos[1]}px;
    left: ${pos[0]}px;
    transform: translate(
      ${parentWidth && pos[0] > parentWidth / 2 ? '-100%' : '0'},
      ${parentHeight && pos[1] > parentHeight / 2 ? '-100%' : '0'}
    );

    width: 350px;
    min-height: ${projects.length > 1 ? 215 : 190}px;
    max-height: 55%;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #fff;
    border: solid 0.5px #c4c4c4;
    z-index: 300;
    border-radius: 6px;
    padding: ${projects.length > 1
      ? '0.5rem 0.25rem 0.25rem 0.25rem'
      : '0.5rem 2rem 0.25rem 0.25rem'};
  `;

  function handleNext() {
    setActiveProjectId(projects[activeProjectIndex + 1].projectId);
    handleActiveFeatureChange(projects[activeProjectIndex + 1].projectId);
  }

  function handleBack() {
    setActiveProjectId(projects[activeProjectIndex - 1].projectId);
    handleActiveFeatureChange(projects[activeProjectIndex - 1].projectId);
  }

  const activeProject = projects[activeProjectIndex];

  if (!activeProject) {
    return null;
  }

  const pageNumberIndicator = `${activeProjectIndex + 1}/${projects.length}`;

  return (
    <Box css={toolbarStyle}>
      <Box
        css={css`
          position: absolute;
          left: 0.25rem;
          top: 0.5rem;
          color: #525252;
        `}
      >
        {projects.length > 1 && pageNumberIndicator}
      </Box>
      <IconButton
        css={css`
          position: absolute;
          right: 0;
          top: 0;
          padding: 0.25rem;
        `}
        onClick={handleCloseInfoBox}
      >
        <CloseIcon />
      </IconButton>
      <Box
        css={css`
          display: flex;
          align-items: center;
        `}
      >
        {projects.length > 1 && (
          <IconButton
            css={css`
              padding: 0;
            `}
            onClick={handleBack}
            disabled={activeProjectIndex === 0}
          >
            <NavigateBefore />
          </IconButton>
        )}
        <Box
          css={css`
            min-width: 0; // for ellipsis to work
            padding: 0 0.75rem;
          `}
        >
          <Typography
            title={activeProject?.projectName}
            css={css`
              margin-left: ${pageNumberIndicator.length > 3
                ? pageNumberIndicator.length > 5
                  ? 30
                  : 15
                : 0}px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              font-size: 1rem;
              font-weight: 700;
            `}
          >
            {activeProject?.projectName}
          </Typography>

          {activeProject && <ProjectDetails project={activeProject} />}
          <Link
            css={css`
              pointer-events: ${!projects ? 'none' : 'auto'};
            `}
            to={`/${
              activeProject?.projectType === 'investmentProject'
                ? 'investointihanke'
                : 'asemakaavahanke'
            }/${activeProject?.projectId}`}
          >
            <Button disabled={!projects} endIcon={<ChevronRight />} onClick={handleCloseInfoBox}>
              {tr('projectInfoBox.toProject')}
            </Button>
          </Link>
        </Box>

        {projects.length > 1 && (
          <IconButton
            css={css`
              margin-left: auto;
              padding: 0;
            `}
            onClick={handleNext}
            disabled={activeProjectIndex === projects.length - 1}
          >
            <NavigateNext />
          </IconButton>
        )}
      </Box>
      {projects.length > 1 && (
        <StepIndicator steps={projects.length} activeStep={activeProjectIndex} />
      )}
    </Box>
  );
}
